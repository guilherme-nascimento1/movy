import { Module } from '@nestjs/common';
// Pilates usa os modelos existentes Class (equipment, level) e ClassCheckin (sessionFocus via notes).
// As turmas de Pilates são gerenciadas pelo ClassesModule com os campos opcionais:
//   Class.equipment (Solo/Reformer/Cadillac/Chair/Barrel)
//   Class.level (BEGINNER/INTERMEDIATE/ADVANCED)
//   Class.modality = "PILATES"
// Este módulo existe para registro no AppModule e pode ser expandido conforme necessário.

@Module({})
export class PilatesModule {}
