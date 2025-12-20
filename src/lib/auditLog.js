import prisma from './prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Extract user information from the request
 * @param {Request} request - The Next.js request object
 * @returns {Promise<{userId: string|null, userName: string|null}>}
 */
export async function getUserFromRequest(request) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
            return {
                userId: session.user.id || null,
                userName: session.user.name || session.user.email || null,
            };
        }
    } catch (error) {
        console.error('Error getting user from request:', error);
    }
    return { userId: null, userName: null };
}

/**
 * Extract client information (IP address and User-Agent) from request
 * @param {Request} request - The Next.js request object
 * @returns {{ipAddress: string|null, userAgent: string|null}}
 */
export function getClientInfo(request) {
    const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        null;

    const userAgent = request.headers.get('user-agent') || null;

    return { ipAddress, userAgent };
}

/**
 * Create an audit log entry
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action type: 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} options.entityType - Type of entity (e.g., 'Member', 'Invoice')
 * @param {string} options.entityId - ID of the entity
 * @param {string} [options.entityName] - Human-readable name/identifier
 * @param {Object} [options.changes] - Before/after values for updates
 * @param {string} [options.userId] - User ID who performed the action
 * @param {string} [options.userName] - User name who performed the action
 * @param {string} [options.ipAddress] - IP address of the client
 * @param {string} [options.userAgent] - User agent of the client
 * @returns {Promise<Object>} The created audit log entry
 */
export async function createAuditLog({
    action,
    entityType,
    entityId,
    entityName = null,
    changes = null,
    userId = null,
    userName = null,
    ipAddress = null,
    userAgent = null,
}) {
    try {
        const auditLog = await prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                entityName,
                changes,
                userId,
                userName,
                ipAddress,
                userAgent,
            },
        });
        return auditLog;
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw - we don't want audit logging to break the main operation
        return null;
    }
}

/**
 * Helper function to log a CREATE action
 * @param {Request} request - The Next.js request object
 * @param {string} entityType - Type of entity
 * @param {Object} entity - The created entity object
 * @param {string} [nameField] - Field name to use as entityName (defaults to 'name')
 */
export async function logCreate(request, entityType, entity, nameField = 'name') {
    const { userId, userName } = await getUserFromRequest(request);
    const { ipAddress, userAgent } = getClientInfo(request);

    await createAuditLog({
        action: 'CREATE',
        entityType,
        entityId: entity.id,
        entityName: entity[nameField] || entity.id,
        userId,
        userName,
        ipAddress,
        userAgent,
    });
}

/**
 * Helper function to log an UPDATE action
 * @param {Request} request - The Next.js request object
 * @param {string} entityType - Type of entity
 * @param {Object} oldEntity - The entity state before update
 * @param {Object} newEntity - The entity state after update
 * @param {string} [nameField] - Field name to use as entityName (defaults to 'name')
 */
export async function logUpdate(request, entityType, oldEntity, newEntity, nameField = 'name') {
    const { userId, userName } = await getUserFromRequest(request);
    const { ipAddress, userAgent } = getClientInfo(request);

    // Calculate what changed
    const changes = {
        before: {},
        after: {},
    };

    for (const key in newEntity) {
        if (oldEntity[key] !== newEntity[key]) {
            changes.before[key] = oldEntity[key];
            changes.after[key] = newEntity[key];
        }
    }

    await createAuditLog({
        action: 'UPDATE',
        entityType,
        entityId: newEntity.id,
        entityName: newEntity[nameField] || newEntity.id,
        changes,
        userId,
        userName,
        ipAddress,
        userAgent,
    });
}

/**
 * Helper function to log a DELETE action
 * @param {Request} request - The Next.js request object
 * @param {string} entityType - Type of entity
 * @param {Object} entity - The entity being deleted
 * @param {string} [nameField] - Field name to use as entityName (defaults to 'name')
 */
export async function logDelete(request, entityType, entity, nameField = 'name') {
    const { userId, userName } = await getUserFromRequest(request);
    const { ipAddress, userAgent } = getClientInfo(request);

    await createAuditLog({
        action: 'DELETE',
        entityType,
        entityId: entity.id,
        entityName: entity[nameField] || entity.id,
        changes: { deleted: entity }, // Store full entity data before deletion
        userId,
        userName,
        ipAddress,
        userAgent,
    });
}
