import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

const repoRoot = path.resolve(__dirname, '../..')
const agentsPath = path.join(repoRoot, 'AGENTS.md')
const codexSkillsDir = path.join(repoRoot, '.agents/skills')
const readmePath = path.join(repoRoot, 'README.md')
const worldSidebarPath = path.join(repoRoot, 'app/src/components/WorldSidebar.tsx')

const expectedSkills = [
  'image-blast-3d',
  'image-blast-comic-scene',
  'image-blast-image-edit',
  'image-blast-plate',
  'image-blast-project',
  'image-blast-sfx',
  'image-blast-uncover',
  'image-blast-wildcard',
  'image-blast-world',
]

describe('Codex adapter', () => {
  it('documents the Codex orchestration contract in AGENTS.md', () => {
    expect(fs.existsSync(agentsPath)).toBe(true)
    const content = fs.readFileSync(agentsPath, 'utf-8')

    expect(content).toContain('Codex')
    expect(content).toContain('node .claude/scripts/project/project-state.mjs')
    expect(content).toContain('WORLD_LABS_API_KEY')
    expect(content).toContain('FAL_KEY')
  })

  it('provides Codex repo skills for the image-blast workflow', () => {
    expect(fs.existsSync(codexSkillsDir)).toBe(true)

    for (const skill of expectedSkills) {
      const skillPath = path.join(codexSkillsDir, skill, 'SKILL.md')
      expect(fs.existsSync(skillPath), `${skill}/SKILL.md missing`).toBe(true)

      const content = fs.readFileSync(skillPath, 'utf-8')
      expect(content).toContain(`name: ${skill}`)
      expect(content).toContain('## Instructions')
      expect(content).toContain('node .claude/scripts/')
      expect(content).not.toMatch(/\bAgent\(/)
    }
  })

  it('presents Codex as the primary user workflow', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8')
    const sidebar = fs.readFileSync(worldSidebarPath, 'utf-8')

    expect(readme).toContain('Codex')
    expect(readme).toContain('codex')
    expect(readme).toContain('Codex replaces the orchestrator')
    expect(sidebar).toContain('Open new Codex terminal')
    expect(sidebar).toContain('/__open-codex-terminal')
  })
})
