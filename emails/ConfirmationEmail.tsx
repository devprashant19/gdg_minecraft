import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Link,
} from '@react-email/components';

interface ConfirmationEmailProps {
  teamCode: string;
  teamName: string;
  trackTitle: string;
  members: { name: string; email: string; isLeader?: boolean }[];
  eventDates?: string;
  venueName?: string;
}

export function ConfirmationEmail({
  teamCode = 'CRAFT-0042',
  teamName = 'Block Pioneers',
  trackTitle = 'Autonomous AI Agents',
  members = [
    { name: 'Alice Developer', email: 'alice@example.com', isLeader: true },
    { name: 'Bob Engineer', email: 'bob@example.com', isLeader: false },
  ],
  eventDates = 'December 20–22, 2026',
  venueName = 'Google Developer Space & Online Hub',
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your team is confirmed for CraftHacks 2026! Code: {teamCode}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>🏝️ CraftHacks 2026</Heading>
          <Text style={subheadingStyle}>Registration Confirmed</Text>

          <Section style={codeBoxStyle}>
            <Text style={codeLabelStyle}>OFFICIAL TEAM CODE</Text>
            <Text style={codeTextStyle}>{teamCode}</Text>
          </Section>

          <Section style={infoSectionStyle}>
            <Text style={textStyle}>
              <strong>Team:</strong> {teamName}
            </Text>
            <Text style={textStyle}>
              <strong>Track:</strong> {trackTitle}
            </Text>
            <Text style={textStyle}>
              <strong>Dates:</strong> {eventDates}
            </Text>
            <Text style={textStyle}>
              <strong>Venue:</strong> {venueName}
            </Text>
          </Section>

          <Hr style={hrStyle} />

          <Section>
            <Heading as="h3" style={h3Style}>
              Registered Roster
            </Heading>
            {members.map((m) => (
              <Text key={m.email} style={textStyle}>
                • {m.name} ({m.email}) {m.isLeader && '👑 (Leader)'}
              </Text>
            ))}
          </Section>

          <Hr style={hrStyle} />

          <Section>
            <Heading as="h3" style={h3Style}>
              Next Steps
            </Heading>
            <Text style={textStyle}>
              1. Review our{' '}
              <Link href="https://example.com/2d#faq" style={linkStyle}>
                Code of Conduct & Rules
              </Link>
              .
            </Text>
            <Text style={textStyle}>
              2. Keep this email and your team code (
              <strong>{teamCode}</strong>) for onsite check-in.
            </Text>
            <Text style={textStyle}>
              3. Questions? Contact organizers at{' '}
              <Link href="mailto:organizers@example.com" style={linkStyle}>
                organizers@example.com
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const mainStyle = {
  backgroundColor: '#120f1d',
  fontFamily: 'monospace, sans-serif',
  padding: '24px 0',
};

const containerStyle = {
  backgroundColor: '#1a162b',
  border: '2px solid #5b8c32',
  borderRadius: '8px',
  padding: '32px',
  maxWidth: '560px',
  margin: '0 auto',
};

const headingStyle = {
  color: '#ffb46b',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 4px',
};

const subheadingStyle = {
  color: '#e5b83b',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const codeBoxStyle = {
  backgroundColor: '#0a0814',
  border: '2px dashed #ffb46b',
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const codeLabelStyle = {
  color: '#9ca3af',
  fontSize: '11px',
  letterSpacing: '1px',
  margin: '0 0 6px',
};

const codeTextStyle = {
  color: '#41a85f',
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '3px',
  margin: '0',
};

const infoSectionStyle = {
  margin: '20px 0',
};

const h3Style = {
  color: '#ffb46b',
  fontSize: '16px',
  margin: '16px 0 8px',
};

const textStyle = {
  color: '#d1d5db',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
};

const linkStyle = {
  color: '#60a5fa',
  textDecoration: 'underline',
};

const hrStyle = {
  borderColor: '#374151',
  margin: '20px 0',
};

