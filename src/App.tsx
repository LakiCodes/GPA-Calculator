@@
-import type {
-  AttemptRecord,
-  AttemptType,
-  Course,
-  CourseRecord,
-  CurriculumSelection,
-  ElectiveGroup,
-  GradeEntry,
-  PlannerScenario,
-  Programme,
-  StudentData,
-  YearLevel
-} from "./domain/types";
+import type {
+  AttemptRecord,
+  AttemptType,
+  Course,
+  CourseRecord,
+  CurriculumSelection,
+  ElectiveGroup,
+  GradeEntry,
+  PlannerScenario,
+  Programme,
+  StudentData,
+  YearLevel,
+  ClassName
+} from "./domain/types";
@@
-  const projection = useMemo(
-    () => calculatePlannerProjection(selectedCourses, data.courseRecords, activeScenario),
-    [selectedCourses, data.courseRecords, activeScenario]
-  );
+  const projection = useMemo(
+    () =>
+      calculatePlannerProjection(
+        selectedCourses,
+        data.courseRecords,
+        activeScenario,
+        {
+          programme,
+          selection: activeSelection,
+          registrationInfo: data.registrationInfo,
+          classTarget: activeScenario.classTarget
+        }
+      ),
+    [selectedCourses, data.courseRecords, activeScenario, programme, activeSelection, data.registrationInfo]
+  );
*** End Patch
