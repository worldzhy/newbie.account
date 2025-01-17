import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {ApiKey, Prisma} from '@prisma/client';
import {CursorPipe} from '@framework/pipes/cursor.pipe';
import {OrderByPipe} from '@framework/pipes/order-by.pipe';
import {WherePipe} from '@framework/pipes/where.pipe';
import {Expose} from '../account.helper';
import {AuditLog} from '../audit-logs/audit-log.decorator';
import {GuardByApiKey} from '../security/passport/api-key/api-key.decorator';
import {
  CreateApiKeyDto,
  ReplaceApiKeyDto,
  UpdateApiKeyDto,
} from './api-key.dto';
import {ApiKeyService} from './api-key.service';

@ApiTags('Api keys')
@Controller('users/:userId/api-keys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  /** Create an API key for a team */
  @Post()
  @AuditLog('create-api-key')
  async create(
    @Param('userId') userId: string,
    @Body() data: CreateApiKeyDto
  ): Promise<Expose<ApiKey>> {
    return this.apiKeyService.createApiKey({userId, data});
  }

  /** Get API keys for a user */
  @Get()
  @GuardByApiKey()
  async getAll(
    @Req() request:any,
    @Param('userId') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor', CursorPipe) cursor?: Prisma.ApiKeyWhereUniqueInput,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>
  ): Promise<Expose<ApiKey>[]> {

    return this.apiKeyService.getApiKeysForUser(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  /** Get an API key */
  @Get(':id')
  async get(
    @Param('userId') userId: string,
    @Param('id') id: number
  ): Promise<Expose<ApiKey>> {
    return this.apiKeyService.getApiKeyForUser(userId, id);
  }

  /** Update an API key */
  @Patch(':id')
  @AuditLog('update-api-key')
  async update(
    @Body() data: UpdateApiKeyDto,
    @Param('userId') userId: string,
    @Param('id') id: number
  ): Promise<Expose<ApiKey>> {
    return this.apiKeyService.updateApiKey(userId, id, data);
  }

  /** Replace an API key */
  @Put(':id')
  @AuditLog('update-api-key')
  async replace(
    @Body() data: ReplaceApiKeyDto,
    @Param('userId') userId: string,
    @Param('id') id: number
  ): Promise<Expose<ApiKey>> {
    return this.apiKeyService.updateApiKey(userId, id, data);
  }

  /** Delete an API key */
  @Delete(':id')
  @AuditLog('delete-api-key')
  async remove(
    @Param('userId') userId: string,
    @Param('id') id: number
  ): Promise<Expose<ApiKey>> {
    return this.apiKeyService.deleteApiKey(userId, id);
  }

  /** Get logs for an API key */
  @Get(':id/logs')
  async getLogs(
    @Param('userId') userId: string,
    @Param('id') id: number,
    @Query('take') take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
  ): Promise<Record<string, any>[]> {
    return this.apiKeyService.getApiKeyLogs(userId, id, {
      take,
      cursor,
      where,
    });
  }
}
