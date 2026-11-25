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
  usuario: { select: { id: true, nome: true, email: true, cpf: true, telefone: true } },
  plano: true,
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) { }

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

    const statusFinal = dto.status ?? SubscriptionStatus.PENDENTE;
    const dataInicio = dto.dataInicio ?? this.hoje();
    const dataFim =
      statusFinal === SubscriptionStatus.ATIVA
        ? (dto.dataFim ?? this.addMonths(dataInicio, plan.duracaoMeses))
        : (dto.dataFim ?? null);

    this.checkDates(dataInicio, dataFim);

    if (statusFinal === SubscriptionStatus.PENDENTE) {
      const pendenteExistente = await this.prisma.subscription.findFirst({
        where: {
          usuarioId: dto.usuarioId,
          status: SubscriptionStatus.PENDENTE,
        },
      });

      if (pendenteExistente) {
        const updated = await this.prisma.subscription.update({
          where: { id: pendenteExistente.id },
          data: {
            planoId: dto.planoId,
            dataInicio: this.hoje(),
            dataFim: null,
            status: SubscriptionStatus.PENDENTE,
          },
          include,
        });

        return this.present(updated);
      }
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

  async findAll(filtros: { usuarioId?: number; status?: string }) {
    const whereStatus =
      !filtros.status || filtros.status === 'TODAS'
        ? undefined
        : filtros.status === SubscriptionStatus.CANCELADA
          ? SubscriptionStatus.CANCELADA
          : { not: SubscriptionStatus.CANCELADA };

    const lista = await this.prisma.subscription.findMany({
      where: {
        usuarioId: filtros.usuarioId,
        status: whereStatus,
      },
      include,
      orderBy: { id: 'desc' },
    });

    const apresentadas = lista.map((s) => this.present(s));
    return filtros.status && filtros.status !== 'TODAS'
      ? apresentadas.filter((s) => s.status === filtros.status)
      : apresentadas;
  }

  private async find(id: number) {
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
    const planoIdEfetivo = dto.planoId ?? atual.planoId;

    const plan = await this.prisma.plan.findUnique({
      where: { id: planoIdEfetivo },
    });
    if (!plan || !plan.ativo) {
      throw new BadRequestException('Plano não encontrado ou inativo');
    }

    let dataInicioFinal = dto.dataInicio ?? atual.dataInicio;
    let dataFimFinal = dto.dataFim ?? atual.dataFim;

    const aprovandoPendente =
      dto.status === SubscriptionStatus.ATIVA &&
      atual.status === SubscriptionStatus.PENDENTE;

    // Ao aprovar uma inscrição PENDENTE -> ATIVA, inicia o ciclo a partir de hoje
    if (aprovandoPendente) {
      dataInicioFinal = dto.dataInicio ?? this.hoje();
      dataFimFinal =
        dto.dataFim ?? this.addMonths(dataInicioFinal, plan.duracaoMeses);
    } else if (dto.planoId) {
      if (!dto.dataInicio) dataInicioFinal = this.hoje();
      if (!dto.dataFim) {
        dataFimFinal = this.addMonths(dataInicioFinal, plan.duracaoMeses);
      }
    }

    this.checkDates(dataInicioFinal, dataFimFinal);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (aprovandoPendente) {
        const outraAtiva = await tx.subscription.findFirst({
          where: {
            usuarioId: atual.usuarioId,
            id: { not: id },
            status: SubscriptionStatus.ATIVA,
          },
        });

        // Cancelamento: solicitação PENDENTE com o mesmo planoId da assinatura ATIVA
        if (outraAtiva && outraAtiva.planoId === atual.planoId) {
          await tx.subscription.updateMany({
            where: {
              usuarioId: atual.usuarioId,
              id: { not: id },
              status: SubscriptionStatus.ATIVA,
            },
            data: { status: SubscriptionStatus.CANCELADA },
          });

          return tx.subscription.update({
            where: { id },
            data: { status: SubscriptionStatus.CANCELADA },
            include,
          });
        }

        // Troca de plano: encerra assinatura ATIVA anterior antes de ativar a nova
        if (outraAtiva) {
          await tx.subscription.updateMany({
            where: {
              usuarioId: atual.usuarioId,
              id: { not: id },
              status: SubscriptionStatus.ATIVA,
            },
            data: { status: SubscriptionStatus.CANCELADA },
          });
        }
      }

      return tx.subscription.update({
        where: { id },
        data: {
          planoId: dto.planoId,
          dataInicio:
            dto.planoId || dto.dataInicio || aprovandoPendente
              ? dataInicioFinal
              : undefined,
          dataFim:
            dto.planoId || dto.dataFim || aprovandoPendente
              ? dataFimFinal
              : undefined,
          status: dto.status,
        },
        include,
      });
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