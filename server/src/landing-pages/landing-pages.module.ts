import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandingPage, LandingPageSchema } from './entities/landing-page.schema';
import { LandingPagesController, PublicLandingPageController } from './landing-pages.controller';
import { LandingPagesService } from './landing-pages.service';
// import { LandingPagesController } from './landing-pages.controller';
// import { LandingPagesService } from './landing-pages.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: LandingPage.name, schema: LandingPageSchema }])],
  controllers: [LandingPagesController, PublicLandingPageController],
  providers: [LandingPagesService],
  exports: [LandingPagesService],
})
export class LandingPagesModule {} 