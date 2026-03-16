/** Publishing status of a state machine definition */
export enum StateMachineDefinitionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/** Category hint — helps filtering and UI grouping */
export enum StateMachineCategory {
  LIFECYCLE = 'lifecycle',
  APPROVAL = 'approval',
  PROCESS = 'process',
  CUSTOM = 'custom',
}
