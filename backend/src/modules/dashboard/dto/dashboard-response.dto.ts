import { ApiProperty } from '@nestjs/swagger';

export class KpiDto {
  @ApiProperty({ example: 248, description: 'Alunos com matrícula ativa' }) activeStudents!: number;
  @ApiProperty({ example: 8, description: 'Novos alunos no mês atual' }) newStudentsThisMonth!: number;
  @ApiProperty({ example: 12.5, description: 'Crescimento % de alunos vs. mês anterior' }) studentsGrowthPercent!: number;
  @ApiProperty({ example: 37052.10, description: 'Receita confirmada no mês atual (R$)' }) revenueThisMonth!: number;
  @ApiProperty({ example: 8.3, description: 'Crescimento % de receita vs. mês anterior' }) revenueGrowthPercent!: number;
  @ApiProperty({ example: 14, description: 'Cobranças pendentes vencidas' }) overdueCount!: number;
  @ApiProperty({ example: 5.6, description: 'Taxa de inadimplência (%)' }) defaultRatePercent!: number;
}

export class KpiResponseDto {
  @ApiProperty({ type: KpiDto }) data!: KpiDto;
}

export class RevenueChartItemDto {
  @ApiProperty({ example: '2025-01' }) month!: string;
  @ApiProperty({ example: 37052.10 }) revenue!: number;
}

export class RevenueChartResponseDto {
  @ApiProperty({ type: [RevenueChartItemDto] }) data!: RevenueChartItemDto[];
}
