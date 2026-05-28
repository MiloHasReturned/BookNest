import { describe, expect, it } from 'vitest'
import {
  createCloudIssue,
  isCleanableCloudIssue,
  isTransientFetchError,
} from './cloudDiagnostics'

describe('cloud diagnostics', () => {
  it('classifies fetch failures as network issues', () => {
    const issue = createCloudIssue({
      operation: 'load',
      error: new Error('fetch failed'),
    })

    expect(issue.area).toBe('network')
    expect(issue.title).toBe('Connection timed out')
    expect(isTransientFetchError(new Error('fetch failed'))).toBe(true)
  })

  it('classifies foreign key errors as cleanable data issues', () => {
    const issue = createCloudIssue({
      operation: 'save',
      error: new Error(
        'Supabase request failed for POST booknest_memberships: 409 violates foreign key constraint',
      ),
    })

    expect(issue.area).toBe('supabase-data')
    expect(issue.rawMessage).toContain('POST booknest_memberships')
    expect(isCleanableCloudIssue(issue)).toBe(true)
  })

  it('classifies missing sync config as config issues', () => {
    const issue = createCloudIssue({
      operation: 'load',
      error: new Error('Supabase backend is not configured.'),
    })

    expect(issue.area).toBe('supabase-config')
    expect(issue.nextStep).toContain('offline')
  })
})
