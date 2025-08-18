import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSeriesDetails, getSeriesCast, getSeriesTrailerKey, getSimilarSeries, TMDBSeriesDetails, TMDBCastMember, TMDBMovieResult } from '../services/tmdb';
import { LocalStorageService } from '../services/localStorage';
// Removed: ActorDetailModal import (unused)
import ToastNotification from './ToastNotification';
import { useModal } from '../context/ModalContext';
import { usePaywall } from '../context/PaywallContext';

interface SeriesDetailModalProps {
  open: boolean;
  onClose: () => void; // Kullanılmıyor ama prop interface için tutulmalı
  seriesId: number | null;
}

const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({ open, onClose: _, seriesId }) => {
  const { t } = useTranslation();
  const { openModal, closeModal } = useModal();
  const { openPaywall } = usePaywall();
  const [seriesDetails, setSeriesDetails] = useState<TMDBSeriesDetails | null>(null);
  const [cast, setCast] = useState<TMDBCastMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [similarSeries, setSimilarSeries] = useState<TMDBMovieResult[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  // Removed: actorModalOpen, selectedActorId (unused actor modal states)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');



  const loadSeriesDetails = async () => {
    if (!selectedSeriesId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [details, castData] = await Promise.all([
        getSeriesDetails(selectedSeriesId),
        getSeriesCast(selectedSeriesId)
      ]);
      
      setSeriesDetails(details);
      setCast(castData);
    } catch (err) {
      setError('Failed to load series details');
      console.error('Error loading series details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrailer = async () => {
    if (!selectedSeriesId) return;
    const key = await getSeriesTrailerKey(selectedSeriesId);
    setTrailerKey(key);
  };

  const loadSimilarSeries = async () => {
    if (!selectedSeriesId) return;
    const series = await getSimilarSeries(selectedSeriesId);
    setSimilarSeries(series);
  };

  const handleSimilarSeriesClick = (newSeriesId: number) => {
    // Reset states for new series
    setSeriesDetails(null);
    setCast([]);
    setTrailerKey(null);
    setSimilarSeries([]);
    setError(null);
    setLoading(true);
    // Set new series ID - this will trigger useEffect
    setSelectedSeriesId(newSeriesId);
  };

  const handleActorClick = (actorId: number) => {
    openModal('actor', actorId);
  };

  // Removed: handleActorModalClose (unused function)

  // İzleme durumu state'i
  const [logStatus, setLogStatus] = useState<'watched' | 'watchlist' | null>(null);

  useEffect(() => {
    if (open && seriesId) {
      setSelectedSeriesId(seriesId);
      loadSeriesDetails();
      loadTrailer();
      loadSimilarSeries();
      // İzleme durumunu kontrol et
      const status = LocalStorageService.getLogStatusByTmdbId(seriesId, 'tv');
      setLogStatus(status);
    } else if (!open) {
      // Modal kapandığında state'leri temizle
      setSeriesDetails(null);
      setCast([]);
      setTrailerKey(null);
      setSimilarSeries([]);
      setError(null);
      setLoading(false);
      setSelectedSeriesId(null);
      setLogStatus(null);
      setShowToast(false);
    }
  }, [open, seriesId]);

  const handleWatchlistToggle = () => {
    const seriesIdToUpdate = selectedSeriesId || seriesId;
    if (!seriesIdToUpdate || !seriesDetails) return;

    const newType = logStatus === 'watchlist' ? null : 'watchlist';
    
    if (newType === null) {
      // Kaydı sil
      const logs = LocalStorageService.getMovieLogs();
      const logToDelete = logs.find(log => log.tmdbId === seriesIdToUpdate && log.mediaType === 'tv');
      if (logToDelete) {
        LocalStorageService.deleteMovieLog(logToDelete.id);
      }
      setLogStatus(null);
      setToastMessage(t('toast.series_removed_from_watchlist', { title: seriesDetails.name }));
      setShowToast(true);
    } else {
      // İzleme listesine eklemeye çalışırken limit kontrolü yap
      const { canAdd, reason } = LocalStorageService.canAddToWatchlist();
      
      if (!canAdd && reason === 'limit-reached') {
        // Limit aşıldı, paywall göster
        openPaywall('watchlist-limit');
        return;
      }
      
      // Önce mevcut kaydı güncellemeyi dene
      let updatedLog = LocalStorageService.updateLogTypeByTmdbId(seriesIdToUpdate, newType, 'tv');
      
      if (!updatedLog) {
        // Kayıt yoksa yeni kayıt oluştur
        updatedLog = LocalStorageService.saveMovieLog({
          title: seriesDetails.name,
          date: new Date().toISOString().split('T')[0],
          rating: '',
          review: '',
          poster: seriesDetails.poster_path ? `https://image.tmdb.org/t/p/w500${seriesDetails.poster_path}` : '',
          type: newType,
          mediaType: 'tv',
          tmdbId: seriesIdToUpdate,
          contentType: 'tv',
          seasonCount: seriesDetails.number_of_seasons,
          episodeCount: seriesDetails.number_of_episodes,
          seriesId: seriesDetails.id.toString(),
          seriesTitle: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path ? `https://image.tmdb.org/t/p/w500${seriesDetails.poster_path}` : '',
          genres: seriesDetails.genres?.map(g => g.name) || [],
          releaseYear: seriesDetails.first_air_date ? new Date(seriesDetails.first_air_date).getFullYear() : undefined
        });
      }
      setLogStatus(newType);
      setToastMessage(t('toast.series_added_to_watchlist', { title: seriesDetails.name }));
      setShowToast(true);
    }
  };

  const handleWatchedToggle = () => {
    const seriesIdToUpdate = selectedSeriesId || seriesId;
    if (!seriesIdToUpdate || !seriesDetails) return;

    const newType = logStatus === 'watched' ? null : 'watched';
    
    if (newType === null) {
      // Kaydı sil
      const logs = LocalStorageService.getMovieLogs();
      const logToDelete = logs.find(log => log.tmdbId === seriesIdToUpdate && log.mediaType === 'tv');
      if (logToDelete) {
        LocalStorageService.deleteMovieLog(logToDelete.id);
      }
      setLogStatus(null);
      setToastMessage(t('toast.series_removed_from_watchlist', { title: seriesDetails.name }));
      setShowToast(true);
    } else {
      // Önce mevcut kaydı güncellemeyi dene
      let updatedLog = LocalStorageService.updateLogTypeByTmdbId(seriesIdToUpdate, newType, 'tv');
      
      if (!updatedLog) {
        // Kayıt yoksa yeni kayıt oluştur
        updatedLog = LocalStorageService.saveMovieLog({
          title: seriesDetails.name,
          date: new Date().toISOString().split('T')[0],
          rating: '',
          review: '',
          poster: seriesDetails.poster_path ? `https://image.tmdb.org/t/p/w500${seriesDetails.poster_path}` : '',
          type: newType,
          mediaType: 'tv',
          tmdbId: seriesIdToUpdate,
          contentType: 'tv',
          seasonCount: seriesDetails.number_of_seasons,
          episodeCount: seriesDetails.number_of_episodes,
          seriesId: seriesDetails.id.toString(),
          seriesTitle: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path ? `https://image.tmdb.org/t/p/w500${seriesDetails.poster_path}` : '',
          genres: seriesDetails.genres?.map(g => g.name) || [],
          releaseYear: seriesDetails.first_air_date ? new Date(seriesDetails.first_air_date).getFullYear() : undefined
        });
      }
      setLogStatus(newType);
      setToastMessage(t('toast.series_marked_as_watched', { title: seriesDetails.name }));
      setShowToast(true);
    }
  };

  // Removed: formatYear function (unused utility)

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full h-full bg-[#0C1117] overflow-y-auto">
        {/* Back Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 left-4 z-10 w-6 h-6 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="#F8F8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Action Buttons - Sağ Üst */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {/* İzledim Butonu */}
          <button
            onClick={handleWatchedToggle}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
              logStatus === 'watched' 
                ? 'bg-[#FE7743] text-white shadow-lg' 
                : 'bg-black bg-opacity-50 text-[#F8F8FF] hover:bg-opacity-70'
            }`}
            aria-label={logStatus === 'watched' ? 'İzledim olarak işaretle' : 'İzledim olarak işaretle'}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill={logStatus === 'watched' ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* İzleme Listesi Butonu */}
          <button
            onClick={handleWatchlistToggle}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
              logStatus === 'watchlist' 
                ? 'bg-[#FE7743] text-white shadow-lg' 
                : 'bg-black bg-opacity-50 text-[#F8F8FF] hover:bg-opacity-70'
            }`}
            aria-label={logStatus === 'watchlist' ? 'İzleme listesinden çıkar' : 'İzleme listesine ekle'}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill={logStatus === 'watchlist' ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white font-poppins">{t('series_detail_modal.loading')}</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-400 font-poppins">{t('series_detail_modal.error')}</div>
          </div>
        ) : seriesDetails ? (
          <>
            {/* Poster Background */}
            <div className="relative h-[424px] w-full">
              <img
                src={seriesDetails.backdrop_path ? `https://image.tmdb.org/t/p/w500${seriesDetails.backdrop_path}` : 'https://placehold.co/393x424?text=No+Image'}
                alt={seriesDetails.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80"></div>
            </div>

            {/* Content Container */}
            <div className="relative -mt-16 px-[18px] pb-20">
              <div className="bg-[#0C1117] rounded-t-[24px] p-4 pb-8">
                {/* Series Title and Genres */}
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-[#F8F8FF] font-poppins font-extrabold text-2xl leading-6 drop-shadow-[0_4px_15px_rgba(255,255,255,0.7)]">
                    {seriesDetails.name}
                  </h1>
                  <div className="flex gap-1">
                    {seriesDetails.genres?.slice(0, 2).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-1 py-0.5 bg-[rgba(254,119,67,0.5)] rounded-lg text-[#F8F8FF] text-[10px] font-poppins font-medium"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Seasons and Episodes */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#F8F8FF] font-poppins font-semibold text-base drop-shadow-[0_8px_15px_rgba(255,255,255,0.7)]">
                    {seriesDetails.number_of_seasons} {t('series_detail_modal.seasons')}{seriesDetails.number_of_seasons !== 1 ? 's' : ''}
                  </span>
                  <div className="w-2.5 h-2.5 bg-[#F8F8FF] rounded-full drop-shadow-[0_8px_15px_rgba(255,255,255,0.7)]"></div>
                  <span className="text-[#F8F8FF] font-poppins font-semibold text-base drop-shadow-[0_8px_15px_rgba(255,255,255,0.7)]">
                    {seriesDetails.number_of_episodes} {t('series_detail_modal.episodes')}
                  </span>
                </div>

                {/* Rating */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FE7743] rounded-xl mb-2 drop-shadow-[0_4px_15px_rgba(255,255,255,0.5)]">
                  <span className="text-[#F8F8FF] font-poppins text-xs">{t('series_detail_modal.imdb_rating')}</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[#F8F8FF] font-poppins text-sm">
                      {seriesDetails.vote_average ? seriesDetails.vote_average.toFixed(1) : 'N/A'}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#F8F8FF">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                </div>

                {/* Overview */}
                <p className="text-[#EFEEEA] font-poppins text-xs leading-6 mb-4">
                  {seriesDetails.overview || t('series_detail_modal.no_overview')}
                </p>

                {/* Cast Section */}
                <div className="mb-4">
                  <h2 className="text-[#EFEEEA] font-poppins font-bold text-2xl mb-1">{t('series_detail_modal.stars')}</h2>
                  <div className="flex gap-4 overflow-x-auto">
                    {cast.slice(0, 6).map((member) => (
                      <div 
                        key={member.id} 
                        className="flex flex-col items-center gap-1 min-w-[46px] cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleActorClick(member.id)}
                      >
                        <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[#D9D9D9]">
                          <img
                            src={member.profile_path ? `https://image.tmdb.org/t/p/w500${member.profile_path}` : 'https://placehold.co/50x50?text=?'}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[#F8F8FF] font-poppins text-[10px] font-medium text-center leading-3">
                          {member.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Watch Trailer Section */}
                <div className="mb-4">
                  <h2 className="text-[#F8F8FF] font-poppins font-bold text-2xl mb-2">{t('series_detail_modal.watch_trailer')}</h2>
                  {trailerKey ? (
                    <div className="w-full h-40 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${trailerKey}`}
                        title="YouTube trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-lg"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-[#F8F8FF] font-poppins">{t('series_detail_modal.trailer_not_found')}</span>
                    </div>
                  )}
                </div>

                {/* Similar Series Section */}
                <div className="mb-6">
                  <h2 className="text-[#F8F8FF] font-poppins font-bold text-2xl mb-2">{t('series_detail_modal.liked_others')}</h2>
                  <div className="flex gap-3 overflow-x-auto pb-4">
                    {similarSeries.slice(0, 5).map((series) => (
                      <div 
                        key={series.id} 
                        className="w-[90px] h-[135px] bg-gray-800 rounded-lg border border-white flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleSimilarSeriesClick(series.id)}
                      >
                        <img
                          src={series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : 'https://placehold.co/90x135?text=No+Image'}
                          alt={series.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Toast Notification */}
        <ToastNotification
          isOpen={showToast}
          onClose={() => setShowToast(false)}
          message={toastMessage}
          type="success"
          duration={3000}
        />
      </div>
    </div>
  );
};

export default SeriesDetailModal; 