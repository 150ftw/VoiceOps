import { Project } from '@voiceops/shared';

export const inMemoryProjects: any[] = [
  {
    id: 'proj-voiceops-core',
    workspace_id: 'ws-primary-default',
    name: 'VoiceOps Platform',
    slug: 'voiceops-platform',
    description: 'Autonomous voice-based DevOps engineering monorepo',
    github_repo: '150ftw/VoiceOps',
    github_branch: 'main',
    default_branch: 'main',
    repository: {
      id: 1,
      repo_full_name: '150ftw/VoiceOps',
      repo_name: 'VoiceOps',
      repo_owner: '150ftw',
      default_branch: 'main',
      is_private: false,
    },
    is_active: true,
    last_synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];
