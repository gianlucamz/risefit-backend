import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionStatus } from '../generated/prisma/client.js';
import type { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import type { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';

const include = {
  usuario: { select: { id: true, nome: true, email: true } },
  plano: {
    select: {
      id: true,
      nome: true,
      descricao: true,
      preco: true,
      duracaoMeses: true,
    },
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private hoje(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
  }

  private async syncExpiredSubscriptions() {
    await this.prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ATIVA,
        dataFim: { lt: this.hoje() },
      },
      data: {
        status: SubscriptionStatus.EXPIRADA,
      },
    });
  }

  private present<
    T extends { status: SubscriptionStatus; dataFim: Date | null },
  >(s: T): T {
    if (
      s.status === SubscriptionStatus.ATIVA &&
      s.dataFim &&
      s.dataFim < this.hoje()
    ) {
      return { ...s, status: SubscriptionStatus.EXPIRADA };
    }
    return s;
  }

  private checkDates(inicio: Date, fim: Date | null) {
    if (fim && fim < inicio) {
      throw new BadRequestException(
        'A data de fim não pode ser anterior à data de início',
      );
    }
  }

  async create(dto: CreateSubscriptionDto) {
    await this.syncExpiredSubscriptions();

    const user = await this.prisma.user.findUnique({
      where: { id: dto.usuarioId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planoId },
    });
    if (!plan || !plan.ativo) {
      throw new BadRequestException('Plano não encontrado ou inativo');
    } 

    const dataInicio = dto.dataInicio ?? this.hoje();
    const dataFim =
      dto.dataFim ?? this.addMonths(dataInicio, plan.duracaoMeses);
    this.checkDates(dataInicio, dataFim);

    const statusFinal = dto.status ?? SubscriptionStatus.ATIVA;

    const existente = await this.prisma.subscription.findFirst({
      where: {
        usuarioId: dto.usuarioId,
        status: {
          in: [SubscriptionStatus.ATIVA, SubscriptionStatus.PENDENTE],
        },
      },
    });

    if (existente) {
      const updated = await this.prisma.subscription.update({
        where: { id: existente.id },
        data: {
          planoId: dto.planoId,
          dataInicio,
          dataFim,
          status: statusFinal,
        },
        include,
      });

      return this.present(updated);
    }

    const created = await this.prisma.subscription.create({
      data: {
        usuarioId: dto.usuarioId,
        planoId: dto.planoId,
        dataInicio,
        dataFim,
        status: statusFinal,
      },
      include,
    });

    return this.present(created);
  }

  async findAll(filtros: { usuarioId?: number; status?: SubscriptionStatus }) {
    await this.syncExpiredSubscriptions();

    return this.prisma.subscription.findMany({
      where: {
        usuarioId: filtros.usuarioId,
        status: filtros.status ?? { not: SubscriptionStatus.CANCELADA },
      },
      include,
      orderBy: { id: 'desc' },
    });
  }

  private async find(id: number) {
    await this.syncExpiredSubscriptions();

    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include,
    });
    if (!sub) throw new NotFoundException('Inscrição não encontrada');
    return sub;
  }

  async findOne(id: number) {
    return this.present(await this.find(id));
  }

  async update(id: number, dto: UpdateSubscriptionDto) {
    const atual = await this.find(id);

    let dataInicioFinal = dto.dataInicio ?? atual.dataInicio;
    let dataFimFinal = dto.dataFim ?? atual.dataFim;

    if (dto.planoId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planoId },
      });
      if (!plan || !plan.ativo) {
        throw new BadRequestException('Plano não encontrado ou inativo');
      }

      if (!dto.dataInicio) {
        dataInicioFinal = this.hoje();
      }
      if (!dto.dataFim) {
        dataFimFinal = this.addMonths(dataInicioFinal, plan.duracaoMeses);
      }
    }

    this.checkDates(dataInicioFinal, dataFimFinal);

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        planoId: dto.planoId,
        dataInicio: dto.planoId || dto.dataInicio ? dataInicioFinal : undefined,
        dataFim: dto.planoId || dto.dataFim ? dataFimFinal : undefined,
        status: dto.status,
      },
      include,
    });

    return this.present(updated);
  }

  async remove(id: number) {
    await this.find(id);
    return this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELADA },
      include,
    });
  }
}