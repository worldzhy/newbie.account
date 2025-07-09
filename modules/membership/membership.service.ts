import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Membership, User} from '@prisma/client';
import {MembershipRole, Prisma} from '@prisma/client';
import {
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_DELETE_SOLE_OWNER,
  CANNOT_UPDATE_ROLE_SOLE_OWNER,
  MEMBERSHIP_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from '@framework/exceptions/errors.constants';
import {PrismaService} from '@framework/prisma/prisma.service';
import {AuthService} from '@microservices/account/auth/auth.service';
import {Expose, expose} from '@microservices/account/helpers/expose';
import {AwsSesService} from '@microservices/aws-ses/aws-ses.service';

@Injectable()
export class MembershipService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private ses: AwsSesService,
    private authService: AuthService
  ) {}

  async create(params: {
    organizationId: string;
    ipAddress: string;
    email: string;
    role?: MembershipRole;
  }) {
    const {organizationId, ipAddress, email, role} = params;

    // Register user
    let user: Expose<User> | null;
    user = await this.prisma.user.findFirst({
      where: {emails: {some: {email}}},
    });
    if (!user) {
      user = await this.authService.signup({
        ipAddress,
        userData: {email},
      });
    }

    // Create membership
    const membership = await this.prisma.membership.create({
      data: {
        organization: {connect: {id: organizationId}},
        user: {connect: {id: user.id}},
        role: role,
      },
      include: {organization: {select: {name: true}}},
    });

    // Send invitation email
    this.ses.sendEmailWithTemplate({
      toAddress: `"${user.name}" <${email}>`,
      template: {
        'organizations/invitation': {
          organizationName: membership.organization.name,
          link: `${this.config.get<string>(
            'framework.app.frontendUrl'
          )}/organization/${params.organizationId}`,
        },
      },
    });

    return expose<Membership>(membership);
  }

  async get(organizationId: string, id: number): Promise<Expose<Membership>> {
    const membership = await this.prisma.membership.findUnique({
      where: {id},
      include: {user: true},
    });
    if (!membership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (membership.organizationId !== organizationId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return expose<Membership>(membership);
  }

  async update(
    organizationId: string,
    id: number,
    data: Prisma.MembershipUpdateInput
  ): Promise<Expose<Membership>> {
    const testMembership = await this.prisma.membership.findUnique({
      where: {id},
    });
    if (!testMembership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (testMembership.organizationId !== organizationId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    if (
      testMembership.role === MembershipRole.OWNER &&
      data.role !== MembershipRole.OWNER
    ) {
      const otherOwners = (
        await this.prisma.membership.findMany({
          where: {
            organization: {id: organizationId},
            role: MembershipRole.OWNER,
          },
        })
      ).filter(i => i.id !== id);
      if (!otherOwners.length)
        throw new BadRequestException(CANNOT_UPDATE_ROLE_SOLE_OWNER);
    }
    const membership = await this.prisma.membership.update({
      where: {id},
      data,
      include: {user: true},
    });

    return expose<Membership>(membership);
  }

  async delete(
    organizationId: string,
    id: number
  ): Promise<Expose<Membership>> {
    const testMembership = await this.prisma.membership.findUnique({
      where: {id},
    });
    if (!testMembership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (testMembership.organizationId !== organizationId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    await this.verifyDeleteMembership(testMembership.organizationId, id);
    const membership = await this.prisma.membership.delete({
      where: {id},
      include: {user: true},
    });

    return expose<Membership>(membership);
  }

  /** Verify whether a organization membership can be deleted */
  private async verifyDeleteMembership(
    organizationId: string,
    membershipId: number
  ): Promise<void> {
    const memberships = await this.prisma.membership.findMany({
      where: {organization: {id: organizationId}},
    });
    if (memberships.length === 1)
      throw new BadRequestException(CANNOT_DELETE_SOLE_MEMBER);
    const membership = await this.prisma.membership.findUnique({
      where: {id: membershipId},
    });
    if (!membership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (
      membership.role === 'OWNER' &&
      memberships.filter(i => i.role === 'OWNER').length === 1
    )
      throw new BadRequestException(CANNOT_DELETE_SOLE_OWNER);
  }
}
