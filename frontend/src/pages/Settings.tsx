interface SettingsProps {
  section?: string
}

export function Settings({ section = 'company' }: SettingsProps) {
  return <h1>Settings - {section}</h1>
}

