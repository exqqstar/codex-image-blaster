import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('optional provider configuration', () => {
  it('ships no active provider credentials in the no-key example', () => {
    const example = fs.readFileSync(path.resolve(__dirname, '../../.env.example'), 'utf8')
    const active = example.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#'))
    expect(active).toEqual([])
  })
})
