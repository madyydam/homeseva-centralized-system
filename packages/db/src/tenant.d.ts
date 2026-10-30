/**
 * Isolated Business Database Access Layer (ADR-001, BF-1, BF-6)
 * Guarantees that every query is strictly scoped to a single businessId.
 * No business can read, update, or delete data belonging to another business.
 */
export interface BusinessTenantContext {
    businessId: string;
    businessSlug: string;
}
export declare class IsolatedBusinessDatabase {
    readonly businessId: string;
    readonly businessSlug: string;
    constructor(context: BusinessTenantContext);
    /**
     * Returns a scoped prisma client interface where businessId is strictly bound.
     */
    getBusinessRecord(): Promise<{
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        enabledModules: string[];
    } | null>;
    getEmployees(): Promise<({
        user: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            businessId: string | null;
            roleId: string;
            passwordHash: string;
            mustChangePass: boolean;
            isSuperAdmin: boolean;
            isOwner: boolean;
            totpSecret: string | null;
            totpEnabled: boolean;
            failedAttempts: number;
            lockedUntil: Date | null;
            lastLoginAt: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeCode: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        department: string | null;
        designation: string | null;
        status: import("packages/db/generated/client").$Enums.EmployeeStatus;
        joiningDate: Date | null;
        leavingDate: Date | null;
        reportingManager: string | null;
        businessId: string;
        userId: string | null;
    })[]>;
    getFinanceEntries(): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        type: import("packages/db/generated/client").$Enums.FinanceEntryType;
        amount: import("packages/db/generated/client/runtime/library").Decimal;
        currency: string;
        category: string;
        entryDate: Date;
        reference: string | null;
        attachmentUrl: string | null;
        isLocked: boolean;
        createdById: string;
    }[]>;
    getAuditLogs(limit?: number): Promise<{
        id: string;
        createdAt: Date;
        businessId: string | null;
        userId: string | null;
        action: string;
        entity: string | null;
        entityId: string | null;
        diff: import("packages/db/generated/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
    getTabs(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        type: import("packages/db/generated/client").$Enums.TabType;
        label: string;
        icon: string | null;
        path: string | null;
        sortOrder: number;
    }[]>;
    getMonthlySummaries(year?: number): Promise<{
        id: string;
        updatedAt: Date;
        businessId: string;
        year: number;
        month: number;
        totalSales: import("packages/db/generated/client/runtime/library").Decimal;
        totalExpenses: import("packages/db/generated/client/runtime/library").Decimal;
        netProfit: import("packages/db/generated/client/runtime/library").Decimal;
        salaryCost: import("packages/db/generated/client/runtime/library").Decimal;
        isClosed: boolean;
        closedAt: Date | null;
    }[]>;
    getGentleLeads(options?: {
        studioSlug?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        status: string;
        businessId: string;
        srNo: number | null;
        studioSlug: string;
        studioName: string;
        clientName: string;
        customStatusText: string | null;
        callCount: number;
        notesList: string[];
        city: string | null;
        source: string | null;
        stage: string | null;
        hairLossConcern: string | null;
        interestCategory: string | null;
        estimatedBudget: import("packages/db/generated/client/runtime/library").Decimal | null;
        assignedSpecialist: string | null;
        lastContactDate: string | null;
        nextFollowUpDate: string | null;
        notes: string | null;
        priority: string | null;
        leadDate: Date;
    }[]>;
    upsertGentleLead(lead: {
        id?: string;
        srNo?: number;
        studioSlug: string;
        studioName: string;
        clientName: string;
        phone: string;
        status: string;
        customStatusText?: string | null;
        callCount?: number;
        notesList?: string[];
        city?: string | null;
        source?: string | null;
        stage?: string | null;
        hairLossConcern?: string | null;
        interestCategory?: string | null;
        estimatedBudget?: number | null;
        assignedSpecialist?: string | null;
        lastContactDate?: string | null;
        nextFollowUpDate?: string | null;
        notes?: string | null;
        priority?: string | null;
        createdAt?: Date | string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        status: string;
        businessId: string;
        srNo: number | null;
        studioSlug: string;
        studioName: string;
        clientName: string;
        customStatusText: string | null;
        callCount: number;
        notesList: string[];
        city: string | null;
        source: string | null;
        stage: string | null;
        hairLossConcern: string | null;
        interestCategory: string | null;
        estimatedBudget: import("packages/db/generated/client/runtime/library").Decimal | null;
        assignedSpecialist: string | null;
        lastContactDate: string | null;
        nextFollowUpDate: string | null;
        notes: string | null;
        priority: string | null;
        leadDate: Date;
    }>;
    deleteGentleLead(id: string): Promise<import("packages/db/generated/client").Prisma.BatchPayload>;
    getGentleStudios(): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        shortName: string;
        address: string | null;
        isCustom: boolean;
    }[]>;
    upsertGentleStudio(studio: {
        slug: string;
        name: string;
        shortName: string;
        address?: string | null;
        isCustom?: boolean;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        shortName: string;
        address: string | null;
        isCustom: boolean;
    }>;
    /**
     * Exports an isolated database backup package containing ONLY this business's data.
     */
    exportIsolatedBackupPackage(): Promise<{
        backupVersion: string;
        timestamp: string;
        businessId: string;
        businessSlug: string;
        isolatedScope: boolean;
        data: {
            business: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string | null;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                enabledModules: string[];
            } | null;
            employees: ({
                user: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    businessId: string | null;
                    roleId: string;
                    passwordHash: string;
                    mustChangePass: boolean;
                    isSuperAdmin: boolean;
                    isOwner: boolean;
                    totpSecret: string | null;
                    totpEnabled: boolean;
                    failedAttempts: number;
                    lockedUntil: Date | null;
                    lastLoginAt: Date | null;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                employeeCode: string;
                firstName: string;
                lastName: string;
                email: string | null;
                phone: string | null;
                department: string | null;
                designation: string | null;
                status: import("packages/db/generated/client").$Enums.EmployeeStatus;
                joiningDate: Date | null;
                leavingDate: Date | null;
                reportingManager: string | null;
                businessId: string;
                userId: string | null;
            })[];
            finance: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                businessId: string;
                type: import("packages/db/generated/client").$Enums.FinanceEntryType;
                amount: import("packages/db/generated/client/runtime/library").Decimal;
                currency: string;
                category: string;
                entryDate: Date;
                reference: string | null;
                attachmentUrl: string | null;
                isLocked: boolean;
                createdById: string;
            }[];
            audit: {
                id: string;
                createdAt: Date;
                businessId: string | null;
                userId: string | null;
                action: string;
                entity: string | null;
                entityId: string | null;
                diff: import("packages/db/generated/client/runtime/library").JsonValue | null;
                ipAddress: string | null;
                userAgent: string | null;
            }[];
            tabs: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                businessId: string;
                type: import("packages/db/generated/client").$Enums.TabType;
                label: string;
                icon: string | null;
                path: string | null;
                sortOrder: number;
            }[];
            monthly: {
                id: string;
                updatedAt: Date;
                businessId: string;
                year: number;
                month: number;
                totalSales: import("packages/db/generated/client/runtime/library").Decimal;
                totalExpenses: import("packages/db/generated/client/runtime/library").Decimal;
                netProfit: import("packages/db/generated/client/runtime/library").Decimal;
                salaryCost: import("packages/db/generated/client/runtime/library").Decimal;
                isClosed: boolean;
                closedAt: Date | null;
            }[];
        };
    }>;
}
/**
 * Factory to instantiate an isolated database client for a specific business.
 */
export declare function getIsolatedBusinessDb(businessId: string, businessSlug?: string): IsolatedBusinessDatabase;
//# sourceMappingURL=tenant.d.ts.map