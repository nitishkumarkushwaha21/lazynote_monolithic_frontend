import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateRootFolderModal from "../../components/dashboard/CreateRootFolderModal";
import DashboardTopBar from "../../components/dashboard/DashboardTopBar";
import SlateFolderCard from "../../components/dashboard/SlateFolderCard";
import { DashboardSkeleton } from "../../components/skeletons/ContentSkeletons";
import useFileStore from "../../store/useFileStore";

const FOLDER_THEME_STORAGE_KEY = "algonote-folder-card-theme";

const countProblems = (node) =>
  (node.children || []).reduce((total, child) => {
    if (child.type === "file") {
      return total + 1;
    }

    if (child.type === "folder") {
      return total + countProblems(child);
    }

    return total;
  }, 0);

const latestActivity = (node) => {
  let latest = 0;

  const visit = (item) => {
    const updated = item?.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    const created = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
    latest = Math.max(latest, updated || created);
    (item?.children || []).forEach(visit);
  };

  visit(node);
  return latest;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { addItem, deleteItem, fileSystem, renameItem, isLoading, hasLoadedFileSystem } = useFileStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("recent");
  const [folderTheme, setFolderTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "default";
    }

    return window.localStorage.getItem(FOLDER_THEME_STORAGE_KEY) || "default";
  });

  const rootFolders = useMemo(
    () => fileSystem.filter((item) => item.type === "folder"),
    [fileSystem],
  );

  const problemCount = useMemo(
    () => rootFolders.reduce((total, folder) => total + countProblems(folder), 0),
    [rootFolders],
  );

  const visibleFolders = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const matched = rootFolders.filter((folder) =>
      folder.name.toLowerCase().includes(query),
    );

    return [...matched].sort((left, right) => {
      if (sortValue === "name") {
        return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
      }

      if (sortValue === "problems") {
        const countDelta = countProblems(right) - countProblems(left);
        if (countDelta !== 0) {
          return countDelta;
        }

        return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
      }

      return latestActivity(right) - latestActivity(left);
    });
  }, [rootFolders, searchValue, sortValue]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FOLDER_THEME_STORAGE_KEY, folderTheme);
    }
  }, [folderTheme]);

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (!newFolderName.trim()) {
      return;
    }

    try {
      await addItem(null, newFolderName, "folder");
      setIsCreateModalOpen(false);
      setNewFolderName("");
    } catch (error) {
      console.error("Failed to create folder", error);
    }
  };

  const handleRenameFolder = async (folder, nextName) => {
    const name = nextName?.trim();
    if (!name || name === folder.name) {
      return;
    }

    try {
      await renameItem(folder.id, name);
    } catch (error) {
      console.error("Failed to rename folder", error);
    }
  };

  const handleDeleteFolder = async (folder) => {
    try {
      await deleteItem(folder.id);
    } catch (error) {
      console.error("Failed to delete folder", error);
    }
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);
  const showEmptyWorkspace = hasLoadedFileSystem && rootFolders.length === 0;
  const showNoMatches =
    hasLoadedFileSystem && rootFolders.length > 0 && visibleFolders.length === 0;

  return (
    <div className="relative h-full overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_24%),#060b14] p-8">
      <CreateRootFolderModal
        isOpen={isCreateModalOpen}
        value={newFolderName}
        onChange={setNewFolderName}
        onClose={closeCreateModal}
        onSubmit={handleCreateFolder}
      />

      <DashboardTopBar
        searchValue={searchValue}
        sortValue={sortValue}
        themeValue={folderTheme}
        folderCount={rootFolders.length}
        problemCount={problemCount}
        hasLoadedFileSystem={hasLoadedFileSystem}
        onSearchChange={setSearchValue}
        onSortChange={setSortValue}
        onThemeChange={setFolderTheme}
        onCreateFolder={() => setIsCreateModalOpen(true)}
      />

      {isLoading && !hasLoadedFileSystem ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visibleFolders.map((folder) => (
            <SlateFolderCard
              key={folder.id}
              folder={{
                ...folder,
                files: countProblems(folder),
                created: folder.createdAt || Date.now(),
                activityAt: latestActivity(folder) || folder.createdAt || Date.now(),
              }}
              theme={folderTheme}
              onOpen={() => navigate(`/folder/${folder.id}`)}
              onRename={(_folderId, nextName) => handleRenameFolder(folder, nextName)}
              onDelete={() => handleDeleteFolder(folder)}
            />
          ))}

          {showNoMatches && (
            <div className="col-span-full flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
              <p className="text-sm text-white/70">No folders match</p>
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="mt-4 rounded-xl border border-white/14 px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
              >
                Clear search
              </button>
            </div>
          )}

          {showEmptyWorkspace && (
            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="group flex min-h-[138px] cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-white/50 transition-all hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-white/[0.03] hover:text-white/78"
            >
              <div className="flex justify-end">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-2xl leading-none text-white/58 transition group-hover:border-blue-400/20 group-hover:bg-blue-500/[0.08] group-hover:text-blue-200">
                  +
                </div>
              </div>

              <div>
                <div className="font-mono text-[1.05rem] font-semibold tracking-[-0.03em] text-white/90">
                  New folder
                </div>
                <div className="mt-2 text-sm text-white/42">
                  Create a folder for a topic or sheet.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
