import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingPage, LandingPageDocument } from './entities/landing-page.schema';

@Injectable()
export class LandingPagesService {
  constructor(
    @InjectModel(LandingPage.name)
    private landingPageModel: Model<LandingPageDocument>,
  ) {}

  async create(data: Partial<LandingPage>): Promise<LandingPage> {
    const created = new this.landingPageModel(data);
    return created.save();
  }

  async findAll(clientId?: string): Promise<LandingPage[]> {
    const filter = clientId ? { clientId } : {};
    return this.landingPageModel.find(filter).exec();
  }

  async findOne(id: string): Promise<LandingPage | null> {
    return this.landingPageModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<LandingPage | null> {
    return this.landingPageModel.findOne({ slug, status: 'published' }).exec();
  }

  async update(id: string, data: Partial<LandingPage>): Promise<LandingPage | null> {
    return this.landingPageModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string): Promise<any> {
    return this.landingPageModel.findByIdAndDelete(id).exec();
  }
} 