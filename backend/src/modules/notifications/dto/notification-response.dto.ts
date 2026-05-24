import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { NotifChannel, NotifStatus } from '../../../common/enums';

export class NotificationLogDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'PAYMENT_DUE', description: 'Tipo: PAYMENT_DUE, BIRTHDAY, ABSENCE_7_DAYS' }) type!: string;
  @ApiProperty({ enum: NotifChannel, example: NotifChannel.WHATSAPP }) channel!: NotifChannel;
  @ApiProperty({ enum: NotifStatus, example: NotifStatus.PENDING }) status!: NotifStatus;
  @ApiProperty({ example: { studentId: 'uuid', phone: '11999999999', amount: 149.90 } }) payload!: object;
  @ApiPropertyOptional({ example: '2025-01-10T09:00:00.000Z' }) sentAt?: string;
  @ApiProperty({ example: '2025-01-10T08:00:00.000Z' }) createdAt!: string;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationLogDto] }) data!: NotificationLogDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class NotificationStatsDto {
  @ApiProperty({ example: 120 }) sent!: number;
  @ApiProperty({ example: 5 }) pending!: number;
  @ApiProperty({ example: 2 }) failed!: number;
  @ApiProperty({ example: 127 }) total!: number;
}

export class NotificationStatsResponseDto {
  @ApiProperty({ type: NotificationStatsDto }) data!: NotificationStatsDto;
}
