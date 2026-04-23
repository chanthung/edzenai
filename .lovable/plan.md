
## Fix EdZen AI Assistant visibility for Student Progress, Teacher, and Accountant users

### What is actually wrong
The previous fix was applied to `TeacherLayout`, but the Student Progress pages do not use `TeacherLayout`. They use `ProgressLayout`, so the chatbot was added to the wrong layout and never renders across the real `/progress` experience.

### Implementation plan

1. **Mount the chatbot in the actual Progress shell**
   - Update `src/components/progress/ProgressLayout.tsx`
   - Import and render `HelpChatbot` there so it appears on:
     - Progress Dashboard
     - Subjects
     - Assessments
     - Marks Entry
     - Attendance
     - Report Cards
     - Student detail progress page

2. **Keep accountant support in the real accountant shell**
   - Verify `src/components/admin/AccountantLayout.tsx` remains the source of truth for accountant pages
   - Ensure the chatbot stays mounted there for accountant users across fee/admin pages

3. **Remove the dead-end layout dependency**
   - Stop relying on `src/components/progress/TeacherLayout.tsx` for chatbot availability
   - Either remove the chatbot mount from that file or leave it unused, but the actual fix will be in `ProgressLayout`

4. **Make rendering consistent across roles**
   - Ensure the assistant is available for:
     - School Admin inside progress pages
     - Teacher inside progress pages
     - Accountant inside accountant/admin pages
   - Avoid tying assistant visibility to the wrong layout or route

5. **Harden the floating UI so it doesn’t appear “missing”**
   - Review `HelpChatbot` fixed positioning and stacking
   - Increase reliability of the launcher/panel above page content, drawers, tables, and sticky headers if needed
   - Confirm the closed-state launcher is always visible in the bottom-right on supported pages

6. **Regression check**
   - Verify assistant presence on:
     - `/progress`
     - `/progress/subjects`
     - `/progress/assessments`
     - `/progress/marks`
     - `/progress/attendance`
     - `/progress/report-cards`
     - accountant-accessible `/admin` pages
   - Confirm no backend/auth changes are made

### Files to update
- `src/components/progress/ProgressLayout.tsx` — primary fix
- `src/components/admin/HelpChatbot.tsx` — only if z-index/visibility hardening is needed
- `src/components/progress/TeacherLayout.tsx` — cleanup only, if desired

### Expected outcome
- The EdZen AI Assistant appears reliably for all Student Progress pages
- Teachers can use it throughout the Progress module
- Accountants continue to have it in their portal
- No backend, auth, or data workflow changes
