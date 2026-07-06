const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'use-pmo-queries.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace useProgrammesQuery
content = content.replace(/export function useProgrammesQuery\(\) \{[\s\S]*?return programmes;\s*\},/m, 
`export function useProgrammesQuery() {
  return useQuery<Programme[]>({
    queryKey: ["programmes"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/programmes");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },`);

// Replace useTasksQuery
content = content.replace(/export function useTasksQuery\(id: string\) \{[\s\S]*?return queryTasks;\s*\},/m,
`export function useTasksQuery(id: string) {
  return useQuery<Task[]>({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await fetch(\`http://localhost:5000/api/tasks/programme/\${id}\`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },`);

// Replace usePeopleQuery
content = content.replace(/export function usePeopleQuery\(\) \{[\s\S]*?return people;\s*\},/m,
`export function usePeopleQuery() {
  return useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/manage/people");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },`);

// Replace useVendorsQuery
content = content.replace(/export function useVendorsQuery\(\) \{[\s\S]*?return vendors;\s*\},/m,
`export function useVendorsQuery() {
  return useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/finance/vendors");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },`);

// Replace useDocumentsQuery
content = content.replace(/export function useDocumentsQuery\(pid: string\) \{[\s\S]*?return docs;\s*\},/m,
`export function useDocumentsQuery(pid: string) {
  return useQuery<ProjectDocument[]>({
    queryKey: ["documents", pid],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/library/documents");
      if (!res.ok) throw new Error("Failed to fetch");
      const all = await res.json();
      return all.filter((d: any) => d.programme_id === pid || !pid);
    },`);

fs.writeFileSync(filePath, content);
console.log('Queries updated!');
