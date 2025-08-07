import { db, report, reportTemplates, reportTemplateSections } from "@repo/db";
import { eq, and } from "drizzle-orm";

export const accessChecks = {
  // Check if user has access to a report
  async userAccessAllowed(reportId: string, userId: string) {
    const reportData = await db
      .select()
      .from(report)
      .where(and(
        eq(report.id, reportId),
        eq(report.userId, userId)
      ));

    if (!reportData.length) {
      throw new Error('Report not found or access denied');
    }
    return reportData[0];
  },

  // Check if user has access to a template
  async userTemplateAccessAllowed(templateId: string, userId: string) {
    const template = await db
      .select()
      .from(reportTemplates)
      .where(and(
        eq(reportTemplates.id, templateId),
        eq(reportTemplates.userId, userId)
      ));

    if (!template.length) {
      throw new Error('Template not found or access denied');
    }
    return template[0];
  },

  // Check if user has access to a template section
  async userSectionAccessAllowed(sectionId: string, userId: string) {
    const section = await db
      .select()
      .from(reportTemplateSections)
      .innerJoin(reportTemplates, eq(reportTemplateSections.reportTemplateId, reportTemplates.id))
      .where(and(
        eq(reportTemplateSections.id, sectionId),
        eq(reportTemplates.userId, userId)
      ));

    if (!section.length) {
      throw new Error('Section not found or access denied');
    }
    return section[0];
  },
};
