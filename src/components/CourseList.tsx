const assignmentsToImport = importData.assignments.map(a => {
  // 1. Force the extracted date to be treated as a pure calendar date
  const extractedDate = new Date(a.dueDate);
  
  // 2. Use UTC-based difference to avoid local daylight savings/timezone shifts
  const startUTC = Date.UTC(termStart.getFullYear(), termStart.getMonth(), termStart.getDate());
  const extractedUTC = Date.UTC(extractedDate.getFullYear(), extractedDate.getMonth(), extractedDate.getDate());
  
  // 3. Calculate absolute day difference
  const diffDays = Math.floor((extractedUTC - startUTC) / (1000 * 60 * 60 * 24));
  
  // 4. Force Week 1 for anything from Day 0 to Day 6
  let weekNumber = Math.floor(diffDays / 7) + 1;
  
  // Safety Rails
  if (weekNumber < 1) weekNumber = 1;
  if (weekNumber > 8) weekNumber = 8;

  // 5. Grid Snap Logic
  const finalDate = new Date(termStart);
  const weekOffset = (weekNumber - 1) * 7;
  const dayOffset = a.type === 'discussion' ? 3 : 6; 
  
  finalDate.setDate(termStart.getDate() + weekOffset + dayOffset);
  finalDate.setHours(23, 59, 0, 0);

  const displayTitle = a.title.toLowerCase().includes('mod') 
    ? a.title 
    : `Module ${weekNumber}: ${a.title}`;

  return {
    course_id: courseData.id,
    title: displayTitle,
    due_date: finalDate.toISOString(),
    type: a.type,
    status: 'todo',
    estimated_hours: a.estimatedHours || (a.type === 'discussion' ? 2 : 4)
  };
});