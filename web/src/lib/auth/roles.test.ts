import { describe, expect, it } from 'vitest';
import { decideAccess, hasRole, isRole, requiredRoleFor, safeNext } from './roles';

describe('hasRole', () => {
  it('is hierarchical', () => {
    expect(hasRole('admin', 'analyst')).toBe(true);
    expect(hasRole('analyst', 'analyst')).toBe(true);
    expect(hasRole('viewer', 'analyst')).toBe(false);
    expect(hasRole(null, 'viewer')).toBe(false);
  });

  it('validates role strings', () => {
    expect(isRole('admin')).toBe(true);
    expect(isRole('root')).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

describe('route rules', () => {
  it('maps routes to their minimum role', () => {
    expect(requiredRoleFor('/compare')).toBe('analyst');
    expect(requiredRoleFor('/admin')).toBe('admin');
    expect(requiredRoleFor('/season/2021')).toBe('viewer');
    expect(requiredRoleFor('/compare-not-really')).toBe('viewer');
  });
});

describe('decideAccess (proxy logic)', () => {
  it('sends anonymous users to login, except on public pages', () => {
    expect(decideAccess('/season/2021', null)).toEqual({ type: 'login' });
    expect(decideAccess('/login', null)).toEqual({ type: 'allow' });
    expect(decideAccess('/forbidden', null)).toEqual({ type: 'allow' });
  });

  it('forbids pages above the user role and names the role needed', () => {
    expect(decideAccess('/compare', 'viewer')).toEqual({ type: 'forbidden', required: 'analyst' });
    expect(decideAccess('/admin', 'analyst')).toEqual({ type: 'forbidden', required: 'admin' });
  });

  it('allows pages at or below the user role', () => {
    expect(decideAccess('/compare', 'analyst')).toEqual({ type: 'allow' });
    expect(decideAccess('/admin', 'admin')).toEqual({ type: 'allow' });
    expect(decideAccess('/', 'viewer')).toEqual({ type: 'allow' });
  });
});

describe('safeNext', () => {
  it('only allows same-site relative redirects', () => {
    expect(safeNext('/compare?a=x')).toBe('/compare?a=x');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext(null)).toBe('/');
  });
});
