import { Injectable } from '@nestjs/common';
import { BusinessModality } from '../../common/enums';

const MODALITY_MODULES: Record<BusinessModality, string[]> = {
  [BusinessModality.MUSCULACAO]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'treinos', 'exercicios', 'avaliacao-fisica', 'checkins', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.CROSSFIT]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'crossfit', 'checkins', 'turmas', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.YOGA]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'turmas', 'agenda', 'checkins', 'presenca', 'yoga', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.PILATES]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'turmas', 'agenda', 'avaliacao-postural', 'checkins', 'pilates', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.ARTES_MARCIAIS]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'turmas', 'checkins', 'graduacao', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.NATACAO]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'turmas', 'checkins', 'niveis', 'natacao', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.DANCA]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'turmas', 'checkins', 'eventos', 'danca', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.SPINNING]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'turmas', 'checkins', 'equipamentos', 'spinning', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.BOXE]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'turmas', 'checkins', 'graduacao', 'combates', 'boxe', 'leads', 'equipe', 'automacoes', 'configuracoes'],
  [BusinessModality.STUDIO_PERSONAL]: ['alunos', 'planos', 'matriculas', 'financeiro', 'relatorios', 'agenda-1-1', 'treinos', 'avaliacao-fisica', 'checkins', 'studio-personal', 'leads', 'equipe', 'automacoes', 'configuracoes'],
};

const ALWAYS_PRESENT = ['dashboard', 'movy-ai', 'financeiro', 'relatorios', 'leads', 'equipe', 'automacoes', 'notificacoes', 'configuracoes'];

@Injectable()
export class TenantModuleResolverService {
  resolve(modalities: BusinessModality[]): string[] {
    const modules = new Set<string>(ALWAYS_PRESENT);

    for (const modality of modalities) {
      const items = MODALITY_MODULES[modality] ?? [];
      for (const item of items) modules.add(item);
    }

    return Array.from(modules);
  }
}
