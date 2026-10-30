"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsolatedBusinessDatabase = void 0;
exports.getIsolatedBusinessDb = getIsolatedBusinessDb;
const client_1 = require("./client");
class IsolatedBusinessDatabase {
    constructor(context) {
        if (!context.businessId && !context.businessSlug) {
            throw new Error('[Security Exception] Business context is mandatory for isolated database access.');
        }
        this.businessId = context.businessId;
        this.businessSlug = context.businessSlug;
    }
    /**
     * Returns a scoped prisma client interface where businessId is strictly bound.
     */
    async getBusinessRecord() {
        return client_1.prisma.business.findFirst({
            where: {
                OR: [
                    { id: this.businessId },
                    { slug: this.businessSlug },
                ],
            },
        });
    }
    async getEmployees() {
        return client_1.prisma.employee.findMany({
            where: { businessId: this.businessId },
            include: { user: true },
        });
    }
    async getFinanceEntries() {
        return client_1.prisma.financeEntry.findMany({
            where: { businessId: this.businessId },
            orderBy: { entryDate: 'desc' },
        });
    }
    async getAuditLogs(limit = 100) {
        return client_1.prisma.auditLog.findMany({
            where: { businessId: this.businessId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getTabs() {
        return client_1.prisma.tab.findMany({
            where: { businessId: this.businessId, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getMonthlySummaries(year) {
        return client_1.prisma.monthlySummary.findMany({
            where: {
                businessId: this.businessId,
                ...(year ? { year } : {}),
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
    }
    // ─── Gentle Hair Wigs Isolated Operations ───────────────────────────────────
    async getGentleLeads(options) {
        return client_1.prisma.gentleHairWigsLead.findMany({
            where: {
                businessId: this.businessId,
                ...(options?.studioSlug ? { studioSlug: options.studioSlug } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async upsertGentleLead(lead) {
        const data = {
            businessId: this.businessId,
            studioSlug: lead.studioSlug,
            studioName: lead.studioName,
            clientName: lead.clientName,
            phone: lead.phone,
            status: lead.status,
            customStatusText: lead.customStatusText ?? null,
            callCount: lead.callCount ?? 0,
            notesList: lead.notesList ?? [],
            city: lead.city ?? null,
            source: lead.source ?? null,
            stage: lead.stage ?? null,
            hairLossConcern: lead.hairLossConcern ?? null,
            interestCategory: lead.interestCategory ?? null,
            estimatedBudget: lead.estimatedBudget != null ? lead.estimatedBudget : null,
            assignedSpecialist: lead.assignedSpecialist ?? null,
            lastContactDate: lead.lastContactDate ?? null,
            nextFollowUpDate: lead.nextFollowUpDate ?? null,
            notes: lead.notes ?? null,
            priority: lead.priority ?? 'Normal',
            ...(lead.createdAt ? { createdAt: new Date(lead.createdAt), leadDate: new Date(lead.createdAt) } : {}),
        };
        if (lead.id && !lead.id.startsWith('temp_')) {
            return client_1.prisma.gentleHairWigsLead.upsert({
                where: { id: lead.id },
                update: data,
                create: { id: lead.id, ...data },
            });
        }
        return client_1.prisma.gentleHairWigsLead.create({
            data,
        });
    }
    async deleteGentleLead(id) {
        return client_1.prisma.gentleHairWigsLead.deleteMany({
            where: {
                id,
                businessId: this.businessId,
            },
        });
    }
    async getGentleStudios() {
        return client_1.prisma.gentleHairWigsStudio.findMany({
            where: { businessId: this.businessId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async upsertGentleStudio(studio) {
        return client_1.prisma.gentleHairWigsStudio.upsert({
            where: {
                businessId_slug: {
                    businessId: this.businessId,
                    slug: studio.slug,
                },
            },
            update: {
                name: studio.name,
                shortName: studio.shortName,
                address: studio.address ?? null,
                isCustom: studio.isCustom ?? false,
            },
            create: {
                businessId: this.businessId,
                slug: studio.slug,
                name: studio.name,
                shortName: studio.shortName,
                address: studio.address ?? null,
                isCustom: studio.isCustom ?? false,
            },
        });
    }
    /**
     * Exports an isolated database backup package containing ONLY this business's data.
     */
    async exportIsolatedBackupPackage() {
        const [business, employees, finance, audit, tabs, monthly] = await Promise.all([
            this.getBusinessRecord(),
            this.getEmployees(),
            this.getFinanceEntries(),
            this.getAuditLogs(1000),
            this.getTabs(),
            this.getMonthlySummaries(),
        ]);
        return {
            backupVersion: '1.2.0',
            timestamp: new Date().toISOString(),
            businessId: this.businessId,
            businessSlug: this.businessSlug,
            isolatedScope: true,
            data: {
                business,
                employees,
                finance,
                audit,
                tabs,
                monthly,
            },
        };
    }
}
exports.IsolatedBusinessDatabase = IsolatedBusinessDatabase;
/**
 * Factory to instantiate an isolated database client for a specific business.
 */
function getIsolatedBusinessDb(businessId, businessSlug = businessId) {
    return new IsolatedBusinessDatabase({ businessId, businessSlug });
}
//# sourceMappingURL=tenant.js.map