import CourseTemplatesTab from "@/components/admin/settings/CourseTemplatesTab";

export default function AdminTreatmentCourses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Course Templates</h1>
        <p className="text-muted-foreground">
          Pre-configured treatment recipes (e.g. Ferinject 4 sessions, Ketamine Induction).
          Doctors pick a variant when referring; defaults flow through to the patient's treatment course.
        </p>
      </div>
      <CourseTemplatesTab />
    </div>
  );
}
