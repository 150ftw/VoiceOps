import { DocumentItem } from '@voiceops/shared';

export const inMemoryDocs: DocumentItem[] = [
  {
    id: 'doc-1',
    project_id: 'proj-voiceops-core',
    title: 'Kubernetes Production Runbook',
    filename: 'k8s_production_runbook.md',
    file_type: 'md',
    file_size: 14336,
    status: 'indexed',
    chunks_count: 14,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-2',
    project_id: 'proj-voiceops-core',
    title: 'GitHub Actions Deployment Guide',
    filename: 'deploy_guide.pdf',
    file_type: 'pdf',
    file_size: 45056,
    status: 'indexed',
    chunks_count: 8,
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
];
