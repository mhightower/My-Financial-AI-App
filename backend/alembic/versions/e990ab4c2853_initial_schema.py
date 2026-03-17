"""initial schema

Revision ID: e990ab4c2853
Revises: 
Create Date: 2026-03-13 20:39:57.999291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e990ab4c2853'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('avatar_color', sa.String(length=7), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_name'), 'users', ['name'], unique=True)

    op.create_table(
        'brokerage_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.String(length=50), nullable=False),
        sa.Column('broker_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_brokerage_accounts_id'), 'brokerage_accounts', ['id'], unique=False)
    op.create_index(op.f('ix_brokerage_accounts_user_id'), 'brokerage_accounts', ['user_id'], unique=False)

    op.create_table(
        'watchlists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_user_id', sa.Integer(), nullable=False),
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_watchlists_id'), 'watchlists', ['id'], unique=False)
    op.create_index(op.f('ix_watchlists_owner_user_id'), 'watchlists', ['owner_user_id'], unique=False)

    op.create_table(
        'holdings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('ticker', sa.String(length=10), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('entry_price', sa.Float(), nullable=False),
        sa.Column('entry_date', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['brokerage_accounts.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_holdings_id'), 'holdings', ['id'], unique=False)
    op.create_index(op.f('ix_holdings_user_id'), 'holdings', ['user_id'], unique=False)
    op.create_index(op.f('ix_holdings_account_id'), 'holdings', ['account_id'], unique=False)
    op.create_index(op.f('ix_holdings_ticker'), 'holdings', ['ticker'], unique=False)

    op.create_table(
        'sell_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('ticker', sa.String(length=10), nullable=False),
        sa.Column('shares_sold', sa.Float(), nullable=False),
        sa.Column('price_received', sa.Float(), nullable=False),
        sa.Column('sell_date', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['brokerage_accounts.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_sell_transactions_id'), 'sell_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_sell_transactions_user_id'), 'sell_transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_sell_transactions_account_id'), 'sell_transactions', ['account_id'], unique=False)
    op.create_index(op.f('ix_sell_transactions_ticker'), 'sell_transactions', ['ticker'], unique=False)

    op.create_table(
        'stocks_in_watchlist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('watchlist_id', sa.Integer(), nullable=False),
        sa.Column('ticker', sa.String(length=10), nullable=False),
        sa.Column('buy_reasons', sa.Text(), nullable=True),
        sa.Column('sell_conditions', sa.Text(), nullable=True),
        sa.Column('buy_price', sa.Float(), nullable=True),
        sa.Column('sell_price', sa.Float(), nullable=True),
        sa.Column('stop_loss_pct', sa.Float(), nullable=True),
        sa.Column('added_date', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['watchlist_id'], ['watchlists.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('watchlist_id', 'ticker', name='uq_watchlist_ticker'),
    )
    op.create_index(op.f('ix_stocks_in_watchlist_id'), 'stocks_in_watchlist', ['id'], unique=False)
    op.create_index(op.f('ix_stocks_in_watchlist_watchlist_id'), 'stocks_in_watchlist', ['watchlist_id'], unique=False)
    op.create_index(op.f('ix_stocks_in_watchlist_ticker'), 'stocks_in_watchlist', ['ticker'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_stocks_in_watchlist_ticker'), table_name='stocks_in_watchlist')
    op.drop_index(op.f('ix_stocks_in_watchlist_watchlist_id'), table_name='stocks_in_watchlist')
    op.drop_index(op.f('ix_stocks_in_watchlist_id'), table_name='stocks_in_watchlist')
    op.drop_table('stocks_in_watchlist')

    op.drop_index(op.f('ix_sell_transactions_ticker'), table_name='sell_transactions')
    op.drop_index(op.f('ix_sell_transactions_account_id'), table_name='sell_transactions')
    op.drop_index(op.f('ix_sell_transactions_user_id'), table_name='sell_transactions')
    op.drop_index(op.f('ix_sell_transactions_id'), table_name='sell_transactions')
    op.drop_table('sell_transactions')

    op.drop_index(op.f('ix_holdings_ticker'), table_name='holdings')
    op.drop_index(op.f('ix_holdings_account_id'), table_name='holdings')
    op.drop_index(op.f('ix_holdings_user_id'), table_name='holdings')
    op.drop_index(op.f('ix_holdings_id'), table_name='holdings')
    op.drop_table('holdings')

    op.drop_index(op.f('ix_watchlists_owner_user_id'), table_name='watchlists')
    op.drop_index(op.f('ix_watchlists_id'), table_name='watchlists')
    op.drop_table('watchlists')

    op.drop_index(op.f('ix_brokerage_accounts_user_id'), table_name='brokerage_accounts')
    op.drop_index(op.f('ix_brokerage_accounts_id'), table_name='brokerage_accounts')
    op.drop_table('brokerage_accounts')

    op.drop_index(op.f('ix_users_name'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
