"""add_notifications_table

Revision ID: a3f7b29c1d8e
Revises: 7d9355f8b7fb
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'a3f7b29c1d8e'
down_revision: Union[str, Sequence[str], None] = '7d9355f8b7fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id',             sa.Uuid(),                           nullable=False),
        sa.Column('user_id',        sa.Uuid(),                           nullable=False),
        sa.Column('transaction_id', sa.Uuid(),                           nullable=False),
        sa.Column('email_address',  sqlmodel.sql.sqltypes.AutoString(),  nullable=False),
        sa.Column('book_title',     sqlmodel.sql.sqltypes.AutoString(),  nullable=False),
        sa.Column('type',           sqlmodel.sql.sqltypes.AutoString(),  nullable=False),
        sa.Column('email_sent',     sa.Boolean(),                        nullable=False),
        sa.Column('sent_at',        sa.DateTime(),                       nullable=False),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id']),
        sa.ForeignKeyConstraint(['user_id'],        ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_user_id'),        'notifications', ['user_id'],        unique=False)
    op.create_index(op.f('ix_notifications_transaction_id'), 'notifications', ['transaction_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_transaction_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'),        table_name='notifications')
    op.drop_table('notifications')
