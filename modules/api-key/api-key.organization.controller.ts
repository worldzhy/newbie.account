import {Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UnauthorizedException} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {ApiKey, Prisma} from '@generated/prisma/client';
import {CursorPipe} from '@framework/pipes/cursor.pipe';
import {OrderByPipe} from '@framework/pipes/order-by.pipe';
import {WherePipe} from '@framework/pipes/where.pipe';
import {UserRequest} from '@microservices/account/account.interface';
import {Expose} from '../../helpers/expose';
import {AuditLog} from '../audit-logs/audit-log.decorator';
import {CreateApiKeyDto, ReplaceApiKeyDto, UpdateApiKeyDto} from './api-key.dto';
import {ApiKeyService} from './api-key.service';
import {TokenService} from '../../security/token/token.service';

@ApiTags('Account / Api Key (Organization)')
@ApiBearerAuth()
@Controller('organizations/:organizationId/api-keys')
export class OrganizationApiKeyController {
  constructor(
    private apiKeyService: ApiKeyService,
    private tokenService: TokenService
  ) {}

  /** Create an API key under organization (uses current user from JWT) */
  @Post()
  @AuditLog('create-api-key')
  async create(
    @Req() req: UserRequest,
    @Param('organizationId') organizationId: string,
    @Body() data: CreateApiKeyDto
  ): Promise<Expose<ApiKey>> {
    console.log('req.user', req.user);
    const token = this.tokenService.getTokenFromHttpRequest(req);
    if (!token) {
      throw new UnauthorizedException();
    }
    const payload = this.tokenService.verifyUserAccessToken(token);
    return await this.apiKeyService.createApiKey({userId: payload.userId, organizationId, data});
  }

  /** Get API keys for an organization */
  @Get()
  async getAll(
    @Param('organizationId') organizationId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor', CursorPipe) cursor?: Prisma.ApiKeyWhereUniqueInput,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>
  ): Promise<Expose<ApiKey>[]> {
    return await this.apiKeyService.getApiKeysForOrganization(organizationId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  /** Get an API key under organization */
  @Get(':id')
  async get(@Param('organizationId') organizationId: string, @Param('id') id: number): Promise<Expose<ApiKey>> {
    return await this.apiKeyService.getApiKeyForOrganization(organizationId, id);
  }

  /** Update an API key under organization */
  @Patch(':id')
  @AuditLog('update-api-key')
  async update(
    @Body() data: UpdateApiKeyDto,
    @Param('organizationId') organizationId: string,
    @Param('id') id: number
  ): Promise<Expose<ApiKey>> {
    return await this.apiKeyService.updateApiKeyForOrganization(organizationId, id, data);
  }

  /** Replace an API key under organization */
  @Put(':id')
  @AuditLog('update-api-key')
  async replace(
    @Body() data: ReplaceApiKeyDto,
    @Param('organizationId') organizationId: string,
    @Param('id') id: number
  ): Promise<Expose<ApiKey>> {
    return await this.apiKeyService.updateApiKeyForOrganization(organizationId, id, data);
  }

  /** Delete an API key under organization */
  @Delete(':id')
  @AuditLog('delete-api-key')
  async remove(@Param('organizationId') organizationId: string, @Param('id') id: number): Promise<Expose<ApiKey>> {
    return await this.apiKeyService.deleteApiKeyForOrganization(organizationId, id);
  }

  /** Get logs for an API key under organization */
  @Get(':id/logs')
  async getLogs(
    @Param('organizationId') organizationId: string,
    @Param('id') id: number,
    @Query('take') take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>
  ): Promise<Record<string, any>[]> {
    return await this.apiKeyService.getApiKeyLogsForOrganization(organizationId, id, {
      take,
      cursor,
      where,
    });
  }
}
