"""Generic Alembic script template used by `alembic revision`.

This is the default template content Alembic expects when the
`script_location` in `alembic.ini` points to this local folder.
"""

"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, Sequence[str], None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
	"""Upgrade schema."""
	${upgrades if upgrades else "pass"}


def downgrade() -> None:
	"""Downgrade schema."""
	${downgrades if downgrades else "pass"}
