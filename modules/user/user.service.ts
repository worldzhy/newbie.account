import {Injectable} from '@nestjs/common';
import {User} from '@prisma/client';
import {PrismaService} from '@framework/prisma/prisma.service';
import {
  verifyEmail,
  verifyPhone,
} from '@microservices/account/helpers/validator';
import {userPrismaMiddleware} from './user.prisma.middleware';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
    this.prisma.$use(userPrismaMiddleware);
  }

  /**
   * The account supports username / email / phone.
   */
  async findByAccount(account: string) {
    if (verifyEmail(account)) {
      return await this.prisma.user.findUnique({where: {email: account}});
    } else if (verifyPhone(account)) {
      return await this.prisma.user.findUnique({where: {phone: account}});
    } else {
      return await this.prisma.user.findUnique({where: {username: account}});
    }
  }

  async checkExistence(id: string) {
    const count = await this.prisma.user.count({
      where: {id},
    });
    return count > 0 ? true : false;
  }

  withoutPassword(user: User) {
    const {password, ...others} = user;
    return others;
  }

  /* End */
}
