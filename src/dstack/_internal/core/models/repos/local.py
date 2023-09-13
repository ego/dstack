import tarfile
from pathlib import Path
from typing import BinaryIO, Optional

from pydantic import BaseModel
from typing_extensions import Literal

from dstack._internal.core.models.repos.base import Repo
from dstack._internal.utils.common import PathLike
from dstack._internal.utils.hash import get_sha256, slugify
from dstack._internal.utils.ignore import GitIgnore


class LocalRepoInfo(BaseModel):
    repo_type: Literal["local"] = "local"
    repo_dir: str


class LocalRunRepoData(LocalRepoInfo):
    pass


class LocalRepo(Repo):
    """Represents local folder"""

    repo_id: str
    run_repo_data: LocalRunRepoData

    def __init__(
        self,
        *,
        repo_id: Optional[str] = None,
        repo_dir: Optional[PathLike] = None,
        repo_data: Optional[LocalRunRepoData] = None,
    ):
        if repo_dir is not None:
            repo_data = LocalRunRepoData(repo_dir=str(repo_dir))
        elif repo_data is None:
            raise ValueError("No local repo data provided")

        if repo_id is None:
            repo_id = slugify(Path(repo_data.repo_dir).name, repo_data.repo_dir)

    def write_code_file(self, fp: BinaryIO) -> str:
        with tarfile.TarFile(mode="w", fileobj=fp) as t:
            t.add(
                self.run_repo_data.repo_dir,
                arcname="",
                filter=TarIgnore(self.run_repo_data.repo_dir, globs=[".git"]),
            )
        return f"code/local/{get_sha256(fp)}.tar"


class TarIgnore(GitIgnore):
    def __call__(self, tarinfo: tarfile.TarInfo) -> Optional[tarfile.TarInfo]:
        if self.ignore(tarinfo.path):
            return None
        return tarinfo
