import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { StudentsModule } from './modules/students/students.module';
import { PlansModule } from './modules/plans/plans.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ClassesModule } from './modules/classes/classes.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PhysicalEvalsModule } from './modules/physical-evals/physical-evals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    StudentsModule,
    PlansModule,
    EnrollmentsModule,
    PaymentsModule,
    DashboardModule,
    ClassesModule,
    CheckinsModule,
    NotificationsModule,
    WorkoutsModule,
    LeadsModule,
    PhysicalEvalsModule,
  ],
})
export class AppModule {}
