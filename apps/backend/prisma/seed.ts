import {
  PrismaClient,
  UserRole,
  ProjectStatus,
  ApplicationStatus,
  InternshipStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.matchCache.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.application.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectExperience.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@university.edu',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      name: '系统管理员',
      phone: '13800000000',
    },
  });

  // Create Teacher Users
  console.log('👨‍🏫 Creating teacher users...');
  const teacher1 = await prisma.user.create({
    data: {
      email: 'zhang.wei@university.edu',
      passwordHash: hashedPassword,
      role: UserRole.TEACHER,
      name: '张伟',
      phone: '13800000001',
      teacherProfile: {
        create: {
          department: '计算机科学与技术学院',
          title: '教授',
          researchFields: ['人工智能', '机器学习', '深度学习'],
          bio: '专注于人工智能和机器学习研究，发表SCI论文50余篇。',
        },
      },
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'li.na@university.edu',
      passwordHash: hashedPassword,
      role: UserRole.TEACHER,
      name: '李娜',
      phone: '13800000002',
      teacherProfile: {
        create: {
          department: '软件工程学院',
          title: '副教授',
          researchFields: ['软件工程', '云计算', '分布式系统'],
          bio: '研究方向为云计算和分布式系统，主持国家自然科学基金项目2项。',
        },
      },
    },
  });

  const teacher3 = await prisma.user.create({
    data: {
      email: 'wang.qiang@university.edu',
      passwordHash: hashedPassword,
      role: UserRole.TEACHER,
      name: '王强',
      phone: '13800000003',
      teacherProfile: {
        create: {
          department: '数据科学学院',
          title: '讲师',
          researchFields: ['数据挖掘', '大数据分析', '推荐系统'],
          bio: '专注于数据挖掘和推荐系统研究，与多家企业有合作项目。',
        },
      },
    },
  });

  // Create Student Users
  console.log('👨‍🎓 Creating student users...');
  const student1 = await prisma.user.create({
    data: {
      email: 'chen.ming@student.edu',
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      name: '陈明',
      phone: '13900000001',
      studentProfile: {
        create: {
          studentNumber: '2021001001',
          major: '计算机科学与技术',
          grade: 3,
          gpa: 3.8,
          skills: ['Python', 'TensorFlow', 'PyTorch', 'Java', 'SQL'],
          researchInterests: ['机器学习', '计算机视觉', '自然语言处理'],
          academicBackground: '曾获国家奖学金，参与过2个科研项目',
          selfIntroduction: '我对人工智能充满热情，希望能在实践中提升自己的能力。',
          completeness: 90,
          projectExperiences: {
            create: [
              {
                title: '图像分类系统',
                description: '基于深度学习的图像分类系统，使用ResNet模型',
                role: '核心开发者',
                duration: '2023.03 - 2023.06',
                achievements: '准确率达到95%，发表校级论文一篇',
              },
            ],
          },
        },
      },
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'liu.fang@student.edu',
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      name: '刘芳',
      phone: '13900000002',
      studentProfile: {
        create: {
          studentNumber: '2021001002',
          major: '软件工程',
          grade: 2,
          gpa: 3.6,
          skills: ['JavaScript', 'React', 'Node.js', 'Docker', 'Kubernetes'],
          researchInterests: ['云计算', '微服务架构', 'DevOps'],
          academicBackground: '参与过学校创新创业项目',
          selfIntroduction: '热爱编程，对云原生技术有浓厚兴趣。',
          completeness: 85,
          projectExperiences: {
            create: [
              {
                title: '在线教育平台',
                description: '基于微服务架构的在线教育平台',
                role: '前端负责人',
                duration: '2023.09 - 2024.01',
                achievements: '平台支持1000+并发用户',
              },
            ],
          },
        },
      },
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'zhao.lei@student.edu',
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      name: '赵磊',
      phone: '13900000003',
      studentProfile: {
        create: {
          studentNumber: '2022001001',
          major: '数据科学与大数据技术',
          grade: 2,
          gpa: 3.9,
          skills: ['Python', 'R', 'Spark', 'Hadoop', 'SQL', 'Tableau'],
          researchInterests: ['数据挖掘', '机器学习', '数据可视化'],
          academicBackground: '数学建模竞赛省级一等奖',
          selfIntroduction: '擅长数据分析和可视化，希望在大数据领域深入发展。',
          completeness: 95,
          projectExperiences: {
            create: [
              {
                title: '电商用户行为分析',
                description: '基于大数据的用户行为分析系统',
                role: '数据分析师',
                duration: '2023.06 - 2023.09',
                achievements: '提出的推荐算法提升转化率15%',
              },
              {
                title: '股票预测模型',
                description: '使用机器学习预测股票价格走势',
                role: '项目负责人',
                duration: '2023.10 - 2024.01',
                achievements: '模型准确率达到78%',
              },
            ],
          },
        },
      },
    },
  });

  const student4 = await prisma.user.create({
    data: {
      email: 'sun.yan@student.edu',
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      name: '孙燕',
      phone: '13900000004',
      studentProfile: {
        create: {
          studentNumber: '2022001002',
          major: '人工智能',
          grade: 2,
          gpa: 3.7,
          skills: ['Python', 'TensorFlow', 'OpenCV', 'C++'],
          researchInterests: ['计算机视觉', '目标检测', '图像处理'],
          academicBackground: '参与过国家级大学生创新训练项目',
          selfIntroduction: '对计算机视觉有深入研究，希望在该领域继续深造。',
          completeness: 80,
        },
      },
    },
  });

  // Create Projects
  console.log('📚 Creating research projects...');
  const project1 = await prisma.project.create({
    data: {
      teacherId: teacher1.id,
      title: '基于深度学习的医学图像分析系统',
      description:
        '本项目旨在开发一个基于深度学习的医学图像分析系统，用于辅助医生进行疾病诊断。项目将使用卷积神经网络对CT、MRI等医学影像进行分析，识别病变区域。',
      requirements:
        '要求学生具备扎实的深度学习基础，熟悉Python和TensorFlow/PyTorch框架，有图像处理经验者优先。需要每周至少投入20小时。',
      requiredSkills: ['Python', 'TensorFlow', 'PyTorch', '深度学习', '图像处理'],
      researchField: '人工智能',
      duration: 6,
      positions: 2,
      startDate: new Date('2024-03-01'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      teacherId: teacher1.id,
      title: '自然语言处理在智能客服中的应用',
      description:
        '研究如何将最新的NLP技术应用于智能客服系统，包括意图识别、实体抽取、对话管理等。项目将与企业合作，有机会接触真实业务场景。',
      requirements:
        '需要有NLP基础知识，熟悉Transformer模型，了解BERT、GPT等预训练模型。有Python编程经验，能够独立完成模型训练和部署。',
      requiredSkills: ['Python', 'NLP', 'Transformer', 'BERT', 'PyTorch'],
      researchField: '自然语言处理',
      duration: 4,
      positions: 1,
      startDate: new Date('2024-04-01'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      teacherId: teacher2.id,
      title: '云原生微服务架构设计与实现',
      description:
        '本项目将设计并实现一个基于Kubernetes的云原生微服务系统，包括服务发现、负载均衡、熔断降级等功能。学生将学习到完整的云原生技术栈。',
      requirements:
        '熟悉Docker和Kubernetes，了解微服务架构，有Go或Java开发经验。需要有较强的学习能力和问题解决能力。',
      requiredSkills: ['Docker', 'Kubernetes', 'Go', '微服务', 'gRPC'],
      researchField: '云计算',
      duration: 5,
      positions: 2,
      startDate: new Date('2024-03-15'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      teacherId: teacher2.id,
      title: '分布式存储系统性能优化',
      description:
        '研究分布式存储系统的性能优化方法，包括数据分片、副本管理、一致性协议等。项目将基于开源分布式存储系统进行改进。',
      requirements:
        '需要有扎实的计算机系统基础，了解分布式系统原理，熟悉C++或Go语言。有开源项目贡献经验者优先。',
      requiredSkills: ['C++', 'Go', '分布式系统', 'Raft', 'Linux'],
      researchField: '分布式系统',
      duration: 6,
      positions: 1,
      startDate: new Date('2024-04-01'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const project5 = await prisma.project.create({
    data: {
      teacherId: teacher3.id,
      title: '推荐系统算法研究与实现',
      description:
        '研究协同过滤、深度学习等推荐算法，并在真实数据集上进行实验。项目将与电商企业合作，有机会将算法应用到生产环境。',
      requirements:
        '需要有机器学习基础，熟悉推荐系统常用算法，有Python和Spark使用经验。能够阅读英文论文并复现算法。',
      requiredSkills: ['Python', 'Spark', '机器学习', '推荐系统', 'TensorFlow'],
      researchField: '推荐系统',
      duration: 4,
      positions: 2,
      startDate: new Date('2024-03-20'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const project6 = await prisma.project.create({
    data: {
      teacherId: teacher3.id,
      title: '大数据实时处理平台开发',
      description:
        '开发一个基于Flink的实时数据处理平台，支持流式数据的清洗、转换、聚合等操作。项目将处理每秒百万级的数据流。',
      requirements:
        '熟悉大数据技术栈，了解Flink或Spark Streaming，有Java或Scala开发经验。需要有较强的编程能力和系统设计能力。',
      requiredSkills: ['Java', 'Flink', 'Kafka', 'Hadoop', 'Scala'],
      researchField: '大数据',
      duration: 5,
      positions: 1,
      startDate: new Date('2024-04-15'),
      status: ProjectStatus.ACTIVE,
    },
  });

  // Create Applications
  console.log('📝 Creating applications...');
  const app1 = await prisma.application.create({
    data: {
      studentId: student1.id,
      projectId: project1.id,
      coverLetter:
        '尊敬的张伟教授，我对医学图像分析非常感兴趣。我在之前的项目中使用过深度学习进行图像分类，积累了一定经验。我相信我能够为这个项目做出贡献，同时也希望在医学AI领域深入学习。',
      status: ApplicationStatus.ACCEPTED,
      matchScore: 0.92,
      appliedAt: new Date('2024-02-15'),
      reviewedAt: new Date('2024-02-20'),
    },
  });

  const app2 = await prisma.application.create({
    data: {
      studentId: student2.id,
      projectId: project3.id,
      coverLetter:
        '李娜老师您好，我对云原生技术非常感兴趣，有Docker和Kubernetes的实践经验。我希望能够参与这个项目，学习完整的微服务架构设计。',
      status: ApplicationStatus.ACCEPTED,
      matchScore: 0.88,
      appliedAt: new Date('2024-02-18'),
      reviewedAt: new Date('2024-02-22'),
    },
  });

  const app3 = await prisma.application.create({
    data: {
      studentId: student3.id,
      projectId: project5.id,
      coverLetter:
        '王强老师您好，我在数据挖掘和推荐系统方面有一定研究，曾经实现过协同过滤算法。我非常希望能够参与这个项目，将理论知识应用到实践中。',
      status: ApplicationStatus.REVIEWING,
      matchScore: 0.9,
      appliedAt: new Date('2024-02-20'),
    },
  });

  const app4 = await prisma.application.create({
    data: {
      studentId: student4.id,
      projectId: project1.id,
      coverLetter: '张伟教授您好，我对计算机视觉和医学图像处理很感兴趣，希望能够加入您的团队学习。',
      status: ApplicationStatus.PENDING,
      matchScore: 0.85,
      appliedAt: new Date('2024-02-22'),
    },
  });

  const app5 = await prisma.application.create({
    data: {
      studentId: student3.id,
      projectId: project6.id,
      coverLetter:
        '王强老师您好，我对大数据实时处理很感兴趣，有Spark使用经验，希望能够学习Flink技术。',
      status: ApplicationStatus.PENDING,
      matchScore: 0.82,
      appliedAt: new Date('2024-02-23'),
    },
  });

  // Create Internships
  console.log('🎓 Creating internships...');
  const internship1 = await prisma.internship.create({
    data: {
      applicationId: app1.id,
      studentId: student1.id,
      projectId: project1.id,
      status: InternshipStatus.IN_PROGRESS,
      progress: 60,
      startDate: new Date('2024-03-01'),
      milestones: {
        create: [
          {
            title: '完成文献调研',
            description: '阅读相关论文，了解医学图像分析的最新进展',
            dueDate: new Date('2024-03-15'),
            completed: true,
            completedAt: new Date('2024-03-14'),
          },
          {
            title: '搭建基础模型',
            description: '使用ResNet搭建基础的图像分类模型',
            dueDate: new Date('2024-04-01'),
            completed: true,
            completedAt: new Date('2024-03-30'),
          },
          {
            title: '数据预处理',
            description: '对医学图像数据进行清洗和增强',
            dueDate: new Date('2024-04-15'),
            completed: true,
            completedAt: new Date('2024-04-12'),
          },
          {
            title: '模型训练与优化',
            description: '训练模型并进行超参数调优',
            dueDate: new Date('2024-05-01'),
            completed: false,
          },
          {
            title: '系统集成与测试',
            description: '将模型集成到系统中并进行测试',
            dueDate: new Date('2024-05-15'),
            completed: false,
          },
        ],
      },
      documents: {
        create: [
          {
            filename: '文献综述.pdf',
            fileUrl: '/uploads/internships/1/literature-review.pdf',
            uploadedBy: student1.id,
            fileSize: 2048576,
            mimeType: 'application/pdf',
          },
          {
            filename: '项目进度报告.docx',
            fileUrl: '/uploads/internships/1/progress-report.docx',
            uploadedBy: student1.id,
            fileSize: 512000,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
      },
    },
  });

  const internship2 = await prisma.internship.create({
    data: {
      applicationId: app2.id,
      studentId: student2.id,
      projectId: project3.id,
      status: InternshipStatus.IN_PROGRESS,
      progress: 40,
      startDate: new Date('2024-03-15'),
      milestones: {
        create: [
          {
            title: '学习Kubernetes基础',
            description: '掌握Kubernetes的核心概念和基本操作',
            dueDate: new Date('2024-03-30'),
            completed: true,
            completedAt: new Date('2024-03-28'),
          },
          {
            title: '设计微服务架构',
            description: '设计系统的微服务架构和服务划分',
            dueDate: new Date('2024-04-15'),
            completed: true,
            completedAt: new Date('2024-04-14'),
          },
          {
            title: '实现核心服务',
            description: '实现用户服务、订单服务等核心微服务',
            dueDate: new Date('2024-05-01'),
            completed: false,
          },
          {
            title: '部署到Kubernetes',
            description: '将服务部署到Kubernetes集群',
            dueDate: new Date('2024-05-20'),
            completed: false,
          },
        ],
      },
    },
  });

  // Create Notifications
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        type: 'APPLICATION_REVIEWED',
        title: '申请已通过',
        message: '您申请的"基于深度学习的医学图像分析系统"项目已被接受',
        relatedId: app1.id,
        isRead: true,
        readAt: new Date('2024-02-20'),
      },
      {
        userId: student1.id,
        type: 'PROGRESS_UPDATED',
        title: '里程碑完成',
        message: '您已完成"数据预处理"里程碑',
        relatedId: internship1.id,
        isRead: false,
      },
      {
        userId: student2.id,
        type: 'APPLICATION_REVIEWED',
        title: '申请已通过',
        message: '您申请的"云原生微服务架构设计与实现"项目已被接受',
        relatedId: app2.id,
        isRead: true,
        readAt: new Date('2024-02-22'),
      },
      {
        userId: student3.id,
        type: 'APPLICATION_SUBMITTED',
        title: '申请已提交',
        message: '您的申请已提交，请耐心等待老师审核',
        relatedId: app3.id,
        isRead: true,
        readAt: new Date('2024-02-20'),
      },
      {
        userId: student4.id,
        type: 'APPLICATION_SUBMITTED',
        title: '申请已提交',
        message: '您的申请已提交，请耐心等待老师审核',
        relatedId: app4.id,
        isRead: false,
      },
      {
        userId: teacher1.id,
        type: 'APPLICATION_SUBMITTED',
        title: '收到新申请',
        message: '学生孙燕申请了您的项目"基于深度学习的医学图像分析系统"',
        relatedId: app4.id,
        isRead: false,
      },
      {
        userId: teacher3.id,
        type: 'APPLICATION_SUBMITTED',
        title: '收到新申请',
        message: '学生赵磊申请了您的项目"推荐系统算法研究与实现"',
        relatedId: app3.id,
        isRead: false,
      },
    ],
  });

  // Create Match Cache
  console.log('🎯 Creating match cache...');
  await prisma.matchCache.createMany({
    data: [
      {
        studentId: student1.id,
        projectId: project1.id,
        score: 0.92,
        reasoning: '学生具备深度学习和图像处理经验，技能匹配度高。GPA优秀，有相关项目经验。',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        studentId: student1.id,
        projectId: project2.id,
        score: 0.75,
        reasoning: '学生有深度学习基础，但NLP经验较少。需要额外学习自然语言处理相关知识。',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        studentId: student2.id,
        projectId: project3.id,
        score: 0.88,
        reasoning: '学生熟悉Docker和Kubernetes，有微服务项目经验。技能与项目需求高度匹配。',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        studentId: student3.id,
        projectId: project5.id,
        score: 0.9,
        reasoning: '学生有数据挖掘和机器学习背景，熟悉推荐系统。GPA优秀，有相关项目经验。',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        studentId: student3.id,
        projectId: project6.id,
        score: 0.82,
        reasoning: '学生有大数据基础，但Flink经验较少。需要学习实时流处理技术。',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Create Audit Logs
  console.log('📋 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: teacher1.id,
        action: 'CREATE_PROJECT',
        resource: 'Project',
        details: { projectId: project1.id, title: project1.title },
        ipAddress: '192.168.1.100',
      },
      {
        userId: student1.id,
        action: 'SUBMIT_APPLICATION',
        resource: 'Application',
        details: { applicationId: app1.id, projectId: project1.id },
        ipAddress: '192.168.1.101',
      },
      {
        userId: teacher1.id,
        action: 'REVIEW_APPLICATION',
        resource: 'Application',
        details: { applicationId: app1.id, status: 'ACCEPTED' },
        ipAddress: '192.168.1.100',
      },
      {
        userId: admin.id,
        action: 'LOGIN',
        resource: 'Auth',
        details: { role: 'ADMIN' },
        ipAddress: '192.168.1.1',
      },
    ],
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Teachers: ${await prisma.teacherProfile.count()}`);
  console.log(`- Students: ${await prisma.studentProfile.count()}`);
  console.log(`- Projects: ${await prisma.project.count()}`);
  console.log(`- Applications: ${await prisma.application.count()}`);
  console.log(`- Internships: ${await prisma.internship.count()}`);
  console.log(`- Notifications: ${await prisma.notification.count()}`);
  console.log(`- Match Cache: ${await prisma.matchCache.count()}`);
  console.log(`- Audit Logs: ${await prisma.auditLog.count()}`);
  console.log('\n🔑 Test Credentials:');
  console.log('Admin: admin@university.edu / password123');
  console.log('Teacher: zhang.wei@university.edu / password123');
  console.log('Student: chen.ming@student.edu / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
