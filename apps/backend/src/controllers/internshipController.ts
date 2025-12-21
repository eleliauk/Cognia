import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { internshipService } from '../services/internshipService';
import { InternshipStatus } from '@prisma/client';

export class InternshipController {
  /**
   * Get my internships (based on user role)
   * GET /api/internships
   */
  async getMyInternships(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      let internships;

      if (userRole === 'STUDENT') {
        internships = await internshipService.getInternshipsByStudent(userId);
      } else if (userRole === 'TEACHER') {
        internships = await internshipService.getInternshipsByTeacher(userId);
      } else if (userRole === 'ADMIN') {
        internships = await internshipService.getAllInternships();
      } else {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Invalid user role',
          },
        });
      }

      res.json({
        success: true,
        data: internships,
        count: internships.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create internship record
   * POST /api/internships
   */
  async createInternship(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.body;

      const internship = await internshipService.createInternship({ applicationId });

      res.status(201).json({
        success: true,
        data: internship,
        message: 'Internship created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get internship by ID
   * GET /api/internships/:id
   */
  async getInternshipById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const internship = await internshipService.getInternshipById(id);

      // Check authorization
      const isStudent = userRole === 'STUDENT' && internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' && internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this internship',
          },
        });
      }

      res.json({
        success: true,
        data: internship,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get internships by student
   * GET /api/students/:studentId/internships
   */
  async getInternshipsByStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Check authorization
      if (userRole === 'STUDENT' && studentId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own internships',
          },
        });
      }

      const internships = await internshipService.getInternshipsByStudent(studentId);

      res.json({
        success: true,
        data: internships,
        count: internships.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get internships by teacher
   * GET /api/teachers/:teacherId/internships
   */
  async getInternshipsByTeacher(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.teacherId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Check authorization
      if (userRole === 'TEACHER' && teacherId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own internships',
          },
        });
      }

      const internships = await internshipService.getInternshipsByTeacher(teacherId);

      res.json({
        success: true,
        data: internships,
        count: internships.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update internship progress
   * PUT /api/internships/:id/progress
   */
  async updateProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { progress, status } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get internship to check authorization
      const existingInternship = await internshipService.getInternshipById(id);

      const isStudent = userRole === 'STUDENT' && existingInternship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' && existingInternship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this internship',
          },
        });
      }

      const internship = await internshipService.updateProgress(id, { progress, status });

      res.json({
        success: true,
        data: internship,
        message: 'Internship progress updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update internship status
   * PUT /api/internships/:id/status
   */
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get internship to check authorization
      const existingInternship = await internshipService.getInternshipById(id);

      const isTeacher =
        userRole === 'TEACHER' && existingInternship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      // Only teachers and admins can change status
      if (!isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only teachers and admins can update internship status',
          },
        });
      }

      const internship = await internshipService.updateStatus(id, status as InternshipStatus);

      res.json({
        success: true,
        data: internship,
        message: 'Internship status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Milestone Management ====================

  /**
   * Create milestone
   * POST /api/internships/:id/milestones
   */
  async createMilestone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { title, description, dueDate } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get internship to check authorization
      const internship = await internshipService.getInternshipById(id);

      const isTeacher =
        userRole === 'TEACHER' && internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      // Only teachers and admins can create milestones
      if (!isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only teachers and admins can create milestones',
          },
        });
      }

      const milestone = await internshipService.createMilestone(id, {
        title,
        description,
        dueDate: new Date(dueDate),
      });

      res.status(201).json({
        success: true,
        data: milestone,
        message: 'Milestone created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get milestones for internship
   * GET /api/internships/:id/milestones
   */
  async getMilestones(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get internship to check authorization
      const internship = await internshipService.getInternshipById(id);

      const isStudent = userRole === 'STUDENT' && internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' && internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view these milestones',
          },
        });
      }

      const milestones = await internshipService.getMilestones(id);

      res.json({
        success: true,
        data: milestones,
        count: milestones.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update milestone
   * PUT /api/internships/:internshipId/milestones/:milestoneId
   */
  async updateMilestone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const milestoneId = req.params.milestoneId as string;
      const { title, description, dueDate, completed } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get milestone to check authorization
      const existingMilestone = await internshipService.getMilestoneById(milestoneId);

      const isStudent = userRole === 'STUDENT' && existingMilestone.internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' &&
        existingMilestone.internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this milestone',
          },
        });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
      if (completed !== undefined) updateData.completed = completed;

      const milestone = await internshipService.updateMilestone(milestoneId, updateData);

      res.json({
        success: true,
        data: milestone,
        message: 'Milestone updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete milestone
   * DELETE /api/internships/:internshipId/milestones/:milestoneId
   */
  async deleteMilestone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const milestoneId = req.params.milestoneId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get milestone to check authorization
      const milestone = await internshipService.getMilestoneById(milestoneId);

      const isTeacher =
        userRole === 'TEACHER' && milestone.internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      // Only teachers and admins can delete milestones
      if (!isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only teachers and admins can delete milestones',
          },
        });
      }

      await internshipService.deleteMilestone(milestoneId);

      res.json({
        success: true,
        message: 'Milestone deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark milestone as completed
   * PUT /api/internships/:internshipId/milestones/:milestoneId/complete
   */
  async completeMilestone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const milestoneId = req.params.milestoneId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get milestone to check authorization
      const existingMilestone = await internshipService.getMilestoneById(milestoneId);

      const isStudent = userRole === 'STUDENT' && existingMilestone.internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' &&
        existingMilestone.internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to complete this milestone',
          },
        });
      }

      const milestone = await internshipService.completeMilestone(milestoneId);

      res.json({
        success: true,
        data: milestone,
        message: 'Milestone marked as completed',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Document Management ====================

  /**
   * Upload document
   * POST /api/internships/:id/documents
   */
  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'No file uploaded',
          },
        });
      }

      // Get internship to check authorization
      const internship = await internshipService.getInternshipById(id);

      const isStudent = userRole === 'STUDENT' && internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' && internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to upload documents to this internship',
          },
        });
      }

      // Import fileStorageService dynamically to avoid circular dependency
      const { fileStorageService } = await import('../utils/fileStorage');

      // Save file
      const fileResult = await fileStorageService.saveFile(file);

      // Create document record
      const document = await internshipService.uploadDocument(id, {
        filename: fileResult.filename,
        fileUrl: fileResult.fileUrl,
        uploadedBy: userId,
        fileSize: fileResult.fileSize,
        mimeType: fileResult.mimeType,
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents for internship
   * GET /api/internships/:id/documents
   */
  async getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get internship to check authorization
      const internship = await internshipService.getInternshipById(id);

      const isStudent = userRole === 'STUDENT' && internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' && internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view these documents',
          },
        });
      }

      const documents = await internshipService.getDocuments(id);

      res.json({
        success: true,
        data: documents,
        count: documents.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete document
   * DELETE /api/internships/:internshipId/documents/:documentId
   */
  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.documentId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get document to check authorization
      const document = await internshipService.getDocumentById(documentId);

      const isUploader = document.uploadedBy === userId;
      const isTeacher =
        userRole === 'TEACHER' && document.internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      // Only the uploader, teacher, or admin can delete
      if (!isUploader && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this document',
          },
        });
      }

      // Delete file from storage
      const { fileStorageService } = await import('../utils/fileStorage');
      await fileStorageService.deleteFile(document.filename);

      // Delete document record
      await internshipService.deleteDocument(documentId);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const internshipController = new InternshipController();
