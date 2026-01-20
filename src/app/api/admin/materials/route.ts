import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const materials = await prisma.material.findMany({
      include: {
        subject: true,
        uploadedBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { materialId, status } = await req.json();

    if (!materialId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const material = await prisma.material.update({
      where: { id: materialId },
      data: {
        status,
        approvedById: status === 'APPROVED' ? session.user.id : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Материал ${status === 'APPROVED' ? 'одобрен' : 'отклонен'}`,
      data: material,
    });
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update material' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get('materialId');

    if (!materialId) {
      return NextResponse.json(
        { success: false, error: 'Missing materialId' },
        { status: 400 }
      );
    }

    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (material) {
      // Delete file from filesystem
      try {
        const filePath = join(process.cwd(), 'public', material.filePath);
        await unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }

      // Delete from database
      await prisma.material.delete({
        where: { id: materialId },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Материал удален',
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete material' },
      { status: 500 }
    );
  }
}
