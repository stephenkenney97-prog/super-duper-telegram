import { useCallback, useMemo, useState } from 'react';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft, ClipboardList, Droplet, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { HealthLogEntry } from './HealthLogEntry';
import { HealthLogModal } from './HealthLogModal';
import { EditPlantModal } from './EditPlantModal';
import { resolveAppId } from '../../utils/firebase';
import { getPlantsPath, deletePlantWithHealthLogs } from '../../utils/plants';
import { getWateringStatus, formatWateringDueLabel } from '../../utils/watering';

const appId = resolveAppId();

const STATUS_TEXT_STYLES = {
  overdue: 'text-red-600',
  'due-soon': 'text-amber-600',
  ok: 'text-green-600',
};

export const PlantDetailView = ({ firestore, userId, plant, onBack }) => {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingWatered, setIsMarkingWatered] = useState(false);

  const collectionPath = useMemo(
    () => `/artifacts/${appId}/users/${userId}/plants/${plant.id}/healthLogs`,
    [plant.id, userId],
  );

  const { documents: logs, isLoading, error } = useFirestoreCollection({
    firestore,
    path: collectionPath,
    enabled: Boolean(firestore && userId && plant?.id),
  });

  const status = getWateringStatus(plant);

  const handleMarkWatered = useCallback(async () => {
    setIsMarkingWatered(true);
    try {
      await updateDoc(doc(firestore, getPlantsPath(appId, userId), plant.id), {
        lastWateredAt: Timestamp.now(),
      });
    } catch (markError) {
      console.error('Failed to mark plant as watered', markError);
    } finally {
      setIsMarkingWatered(false);
    }
  }, [firestore, plant.id, userId]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deletePlantWithHealthLogs({ firestore, appId, userId, plantId: plant.id });
      onBack();
    } catch (deleteError) {
      console.error('Failed to delete plant', deleteError);
      setIsDeleting(false);
    }
  }, [firestore, onBack, plant.id, userId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl p-4 mx-auto md:p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} className="mr-2" /> Back to dashboard
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              aria-label="Edit plant"
              title="Edit plant"
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              aria-label="Delete plant"
              title="Delete plant"
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <section className="p-6 bg-white rounded-3xl shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="w-full md:w-1/3">
              <img
                src={plant.profileImageBase64 || 'https://placehold.co/400x400/a0e5b0/4f8a5f?text=Plant'}
                alt={plant.name}
                className="object-cover w-full h-full rounded-2xl"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900">{plant.name}</h1>
              {plant.species && <p className="mt-2 text-lg text-gray-500">{plant.species}</p>}

              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                <Droplet size={16} className={STATUS_TEXT_STYLES[status.state]} />
                <span className={STATUS_TEXT_STYLES[status.state]}>
                  {formatWateringDueLabel(status)}
                </span>
                <button
                  type="button"
                  onClick={handleMarkWatered}
                  disabled={isMarkingWatered}
                  className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full hover:bg-green-200 disabled:opacity-50"
                >
                  {isMarkingWatered ? 'Saving...' : 'Mark watered'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center justify-center w-full px-4 py-3 mt-8 text-white bg-green-600 rounded-lg shadow md:w-auto hover:bg-green-700"
              >
                <Plus size={18} className="mr-2" /> Log new health entry
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <header className="flex items-center gap-3 mb-6">
            <ClipboardList size={22} className="text-green-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Health log</h2>
          </header>

          {isLoading && <LoadingState message="Loading health log..." />}

          {error && (
            <ErrorState
              description="We were unable to load your plant's history."
              onRetry={() => window.location.reload()}
            />
          )}

          {!isLoading && !error && logs.length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-white border border-gray-100 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-700">No entries yet</h3>
              <p className="mt-2 text-sm">
                Capture your first update by tapping the “Log new health entry” button above.
              </p>
            </div>
          )}

          {!isLoading && logs.length > 0 && (
            <div className="space-y-4">
              {logs.map((log) => (
                <HealthLogEntry
                  key={log.id}
                  log={log}
                  firestore={firestore}
                  userId={userId}
                  plantId={plant.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {isLogModalOpen && (
        <HealthLogModal
          firestore={firestore}
          userId={userId}
          plantId={plant.id}
          onClose={() => setIsLogModalOpen(false)}
        />
      )}

      {isEditModalOpen && (
        <EditPlantModal
          firestore={firestore}
          userId={userId}
          plant={plant}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {isConfirmingDelete && (
        <ConfirmDialog
          title="Delete plant?"
          description={`This will permanently delete "${plant.name}" and all of its health log entries. This cannot be undone.`}
          isProcessing={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
};
