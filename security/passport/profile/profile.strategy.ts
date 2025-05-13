import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-custom';
import {Request} from 'express';
import {PrismaService} from '@framework/prisma/prisma.service';

@Injectable()
export class ProfileStrategy extends PassportStrategy(
  Strategy,
  'custom.user-profile'
) {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 'validate' function must be implemented.
   */
  async validate(req: Request): Promise<{userId: string}> {
    // [step 1] Guard statement.
    const profile = req.body;
    const {firstName, middleName, lastName, dateOfBirth} = profile;
    if ((firstName && middleName && lastName && dateOfBirth) === undefined) {
      throw new UnauthorizedException(
        'The firstName, middleName, lastName and dateOfBirth are required.'
      );
    }

    // [step 2] Get profiles.
    const users = await this.prisma.user.findMany({
      where: {firstName, middleName, lastName, dateOfBirth},
    });
    if (users.length !== 1) {
      throw new UnauthorizedException('There are 0 or multiple users.');
    }

    // [step 3] OK.
    return {userId: users[0].id};
  }
}
