export const sampleCourses = [
  {
    id: 'course-001',
    title: 'Code of Ethics and Business Conduct',
    description: 'Comprehensive overview of our organizational values, ethical standards, and expected business conduct for all employees.',
    category: 'Ethics',
    duration: '45 minutes',
    modules: 5,
    passingScore: 80,
    thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    topics: ['Professional Ethics', 'Workplace Integrity', 'Conflict of Interest', 'Gift Policy']
  },
  {
    id: 'course-002',
    title: 'Anti-Harassment and Discrimination',
    description: 'Learn about creating an inclusive workplace, recognizing harassment, and understanding legal protections against discrimination.',
    category: 'Compliance',
    duration: '60 minutes',
    modules: 6,
    passingScore: 85,
    thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
    topics: ['Workplace Respect', 'Equal Opportunity', 'Reporting Procedures', 'Prevention Strategies']
  },
  {
    id: 'course-003',
    title: 'Data Privacy and Information Security',
    description: 'Essential training on protecting sensitive data, cybersecurity best practices, and compliance with data protection regulations.',
    category: 'Security',
    duration: '50 minutes',
    modules: 7,
    passingScore: 80,
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
    topics: ['GDPR Compliance', 'Data Handling', 'Cybersecurity', 'Privacy Rights']
  },
  {
    id: 'course-004',
    title: 'Anti-Bribery and Corruption',
    description: 'Understanding anti-corruption laws, recognizing bribery risks, and maintaining ethical business relationships.',
    category: 'Ethics',
    duration: '40 minutes',
    modules: 5,
    passingScore: 85,
    thumbnail: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
    topics: ['FCPA Compliance', 'Third-Party Due Diligence', 'Gift Limits', 'Red Flags']
  },
  {
    id: 'course-005',
    title: 'Workplace Safety and Health',
    description: 'Critical safety protocols, emergency procedures, and health standards to ensure a safe working environment.',
    category: 'Safety',
    duration: '55 minutes',
    modules: 6,
    passingScore: 80,
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
    topics: ['OSHA Standards', 'Emergency Response', 'Hazard Identification', 'PPE Requirements']
  },
  {
    id: 'course-006',
    title: 'Financial Compliance and Reporting',
    description: 'Learn about financial regulations, accurate reporting requirements, and fraud prevention in financial operations.',
    category: 'Compliance',
    duration: '70 minutes',
    modules: 8,
    passingScore: 85,
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    topics: ['SOX Compliance', 'Internal Controls', 'Fraud Detection', 'Audit Procedures']
  }
];

export const sampleModules = {
  'course-001': [
    {
      id: 'module-001-01',
      courseId: 'course-001',
      title: 'Introduction to Business Ethics',
      type: 'text',
      duration: '8 minutes',
      order: 1,
      content: `# Welcome to Business Ethics Training

## What is Business Ethics?

Business ethics refers to the moral principles and standards that guide behavior in the world of business. It encompasses how organizations and individuals should act in business situations.

### Key Principles:

1. **Integrity** - Being honest and having strong moral principles
2. **Transparency** - Operating in an open and honest manner
3. **Accountability** - Taking responsibility for actions and decisions
4. **Fairness** - Treating all stakeholders equitably
5. **Respect** - Valuing the dignity of all people

## Why Ethics Matter

Ethical behavior in business:
- Builds trust with stakeholders
- Protects company reputation
- Ensures legal compliance
- Creates a positive work culture
- Drives long-term success

### Real-World Impact

Companies with strong ethical foundations consistently outperform their competitors and attract top talent. Ethical lapses, on the other hand, can lead to:
- Legal penalties and fines
- Loss of customer trust
- Damage to brand reputation
- Decreased employee morale
- Financial losses

## Your Role

Every employee plays a crucial role in maintaining our ethical standards. Your daily decisions and actions contribute to our collective integrity.`
    },
    {
      id: 'module-001-02',
      courseId: 'course-001',
      title: 'Understanding Conflicts of Interest',
      type: 'video',
      duration: '10 minutes',
      order: 2,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      content: 'This video explains what constitutes a conflict of interest and how to identify and report potential conflicts in your work.'
    },
    {
      id: 'module-001-03',
      courseId: 'course-001',
      title: 'Gift and Entertainment Policy',
      type: 'interactive',
      duration: '12 minutes',
      order: 3,
      scenarios: [
        {
          id: 'scenario-1',
          title: 'Client Gift Scenario',
          description: 'A vendor offers you tickets to a major sporting event worth $500. What should you do?',
          options: [
            { id: 'a', text: 'Accept the tickets as a gesture of goodwill', correct: false },
            { id: 'b', text: 'Decline politely and explain company policy', correct: true },
            { id: 'c', text: 'Accept but report it to your manager', correct: false },
            { id: 'd', text: 'Accept only if you can reciprocate', correct: false }
          ],
          feedback: {
            correct: 'Excellent! Our policy requires declining gifts over $100 to avoid conflicts of interest.',
            incorrect: 'This could create a conflict of interest. Gifts over $100 should be declined per company policy.'
          }
        },
        {
          id: 'scenario-2',
          title: 'Business Meal',
          description: 'A client invites you to a business lunch at a moderately priced restaurant. Is this acceptable?',
          options: [
            { id: 'a', text: 'Yes, reasonable business meals are acceptable', correct: true },
            { id: 'b', text: 'No, decline all client invitations', correct: false },
            { id: 'c', text: 'Only if you pay for yourself', correct: false },
            { id: 'd', text: 'Accept but do not discuss business', correct: false }
          ],
          feedback: {
            correct: 'Correct! Reasonable business meals are acceptable as part of normal business relationships.',
            incorrect: 'Reasonable business meals are generally acceptable. The key is that they must be modest and business-related.'
          }
        }
      ]
    },
    {
      id: 'module-001-04',
      courseId: 'course-001',
      title: 'Reporting Ethical Concerns',
      type: 'text',
      duration: '7 minutes',
      order: 4,
      content: `# Speaking Up: Reporting Ethical Concerns

## Your Responsibility to Report

If you witness or become aware of potential ethical violations, you have a responsibility to report them. Remember:

- **No Retaliation Policy**: We strictly prohibit retaliation against anyone who reports concerns in good faith
- **Confidentiality**: Reports are kept confidential to the extent possible
- **Anonymous Reporting**: You can report anonymously through our hotline

## How to Report

### Internal Channels:
1. Your direct manager
2. Human Resources
3. Compliance Officer
4. Legal Department

### Anonymous Hotline:
- **Phone**: 1-800-ETHICS-1
- **Online**: ethics.company.com/report
- **Available 24/7** in multiple languages

## What Happens After You Report

1. **Acknowledgment**: Your report is received and logged
2. **Investigation**: A thorough and impartial investigation is conducted
3. **Resolution**: Appropriate action is taken based on findings
4. **Follow-up**: You may receive updates on the resolution (when appropriate)

## Types of Concerns to Report

- Fraud or financial misconduct
- Harassment or discrimination
- Safety violations
- Conflicts of interest
- Violations of laws or regulations
- Breaches of company policy
- Retaliation

Remember: **When in doubt, speak up!**`
    },
    {
      id: 'module-001-05',
      courseId: 'course-001',
      title: 'Module Assessment',
      type: 'quiz',
      duration: '8 minutes',
      order: 5,
      questions: [
        {
          id: 'q1',
          question: 'Which of the following is NOT a core principle of business ethics?',
          options: [
            { id: 'a', text: 'Integrity' },
            { id: 'b', text: 'Maximizing profit at any cost' },
            { id: 'c', text: 'Transparency' },
            { id: 'd', text: 'Accountability' }
          ],
          correctAnswer: 'b',
          explanation: 'While profitability is important, maximizing profit "at any cost" contradicts ethical principles. Sustainable success comes from balancing profits with ethical conduct.'
        },
        {
          id: 'q2',
          question: 'What is the maximum value of gifts you can accept from vendors according to company policy?',
          options: [
            { id: 'a', text: '$50' },
            { id: 'b', text: '$100' },
            { id: 'c', text: '$250' },
            { id: 'd', text: 'No limit' }
          ],
          correctAnswer: 'b',
          explanation: 'Company policy allows acceptance of modest gifts up to $100 in value. Anything above this threshold should be declined.'
        },
        {
          id: 'q3',
          question: 'If you witness potential ethical misconduct, what should you do?',
          options: [
            { id: 'a', text: 'Ignore it if it does not directly affect you' },
            { id: 'b', text: 'Report it through appropriate channels' },
            { id: 'c', text: 'Confront the person directly' },
            { id: 'd', text: 'Post about it on social media' }
          ],
          correctAnswer: 'b',
          explanation: 'You should report any potential ethical violations through the appropriate reporting channels. The company protects reporters from retaliation.'
        },
        {
          id: 'q4',
          question: 'True or False: The company prohibits retaliation against employees who report ethical concerns in good faith.',
          options: [
            { id: 'a', text: 'True' },
            { id: 'b', text: 'False' }
          ],
          correctAnswer: 'a',
          explanation: 'True. The company has a strict no-retaliation policy to encourage employees to speak up about concerns without fear.'
        },
        {
          id: 'q5',
          question: 'A conflict of interest occurs when:',
          options: [
            { id: 'a', text: 'Personal interests interfere with professional duties' },
            { id: 'b', text: 'You disagree with a colleague' },
            { id: 'c', text: 'You have to work overtime' },
            { id: 'd', text: 'You receive constructive feedback' }
          ],
          correctAnswer: 'a',
          explanation: 'A conflict of interest occurs when personal interests could improperly influence your professional judgment or decisions.'
        }
      ]
    }
  ]
};