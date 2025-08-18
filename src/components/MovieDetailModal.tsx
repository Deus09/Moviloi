import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getMovieDetails, getMovieCast, getMovieTrailerKey, getSimilarMovies, TMDBMovieDetails, TMDBCastMember, TMDBMovieResult } from '../services/tmdb';
import { LocalStorageService, MovieLog } from '../services/localStorage';
import ActorDetailModal from './ActorDetailModal';
import AddButtonModal from './AddButtonModal';
import ToastNotification from './ToastNotification';
import { useModal } from '../context/ModalContext';
import { usePaywall } from '../context/PaywallContext';

interface MovieDetailModalProps {
  open: boolean;
  onClose: () => void;
  movieId: number | null;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ open, onClose, movieId }) => {
  const { openModal } = useModal();
  const { openPaywall } = usePaywall();
  const { t } = useTranslation();
  const [movieDetails, setMovieDetails] = useState<TMDBMovieDetails | null>(null);
  const [cast, setCast] = useState<TMDBCastMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [similarMovies, setSimilarMovies] = useState<TMDBMovieResult[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [actorModalOpen, setActorModalOpen] = useState(false);
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  
  // İzleme durumu state'i
  const [logStatus, setLogStatus] = useState<'watched' | 'watchlist' | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  // Film ekleme modalı state'i
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [prefillData, setPrefillData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (open && movieId) {
      setSelectedMovieId(movieId);
      loadMovieDetails();
      loadTrailer();
      loadSimilarMovies();
      // İzleme durumunu kontrol et
      const status = LocalStorageService.getLogStatusByTmdbId(movieId, 'movie');
      setLogStatus(status);
    } else if (!open) {
      // Modal kapandığında state'leri temizle
      setMovieDetails(null);
      setCast([]);
      setTrailerKey(null);
      setSimilarMovies([]);
      setError(null);
      setLoading(false);
      setSelectedMovieId(null);
      setLogStatus(null);
      setShowToast(false);
    }
  }, [open, movieId]);





  const loadMovieDetails = async () => {
    const movieIdToLoad = selectedMovieId || movieId;
    if (!movieIdToLoad) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [details, castData] = await Promise.all([
        getMovieDetails(movieIdToLoad),
        getMovieCast(movieIdToLoad)
      ]);
      
      setMovieDetails(details);
      setCast(castData);
    } catch (err) {
      setError('Failed to load movie details');
      console.error('Error loading movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrailer = async () => {
    const movieIdToLoad = selectedMovieId || movieId;
    if (!movieIdToLoad) return;
    const key = await getMovieTrailerKey(movieIdToLoad);
    setTrailerKey(key);
  };

  const loadSimilarMovies = async () => {
    const movieIdToLoad = selectedMovieId || movieId;
    if (!movieIdToLoad) return;
    const movies = await getSimilarMovies(movieIdToLoad);
    setSimilarMovies(movies);
  };

  const handleSimilarMovieClick = (newMovieId: number) => {
    // Reset states for new movie
    setMovieDetails(null);
    setCast([]);
    setTrailerKey(null);
    setSimilarMovies([]);
    setError(null);
    setLoading(true);
    // Set new movie ID and trigger loading
    setSelectedMovieId(newMovieId);
    // Load new movie data
    loadMovieDetails();
    loadTrailer();
    loadSimilarMovies();
  };

  const handleActorClick = (actorId: number) => {
    openModal('actor', actorId);
  };

  const handleActorModalClose = () => {
    setActorModalOpen(false);
    setSelectedActorId(null);
  };

  // İzleme durumu buton işleyicileri
  const handleWatchlistToggle = () => {
    const movieIdToUpdate = selectedMovieId || movieId;
    if (!movieIdToUpdate || !movieDetails) return;

    const newType = logStatus === 'watchlist' ? null : 'watchlist';
    
    if (newType === null) {
      // Kaydı sil
      const logs = LocalStorageService.getMovieLogs();
      const logToDelete = logs.find(log => log.tmdbId === movieIdToUpdate && log.mediaType === 'movie');
      if (logToDelete) {
        LocalStorageService.deleteMovieLog(logToDelete.id);
      }
      setLogStatus(null);
      // Toast bildirimi göster
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
      let updatedLog = LocalStorageService.updateLogTypeByTmdbId(movieIdToUpdate, newType, 'movie');
      
      if (!updatedLog) {
        // Kayıt yoksa yeni kayıt oluştur
        updatedLog = LocalStorageService.saveMovieLog({
          title: movieDetails.title,
          date: new Date().toISOString().split('T')[0],
          rating: '',
          review: '',
          poster: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : '',
          type: newType,
          mediaType: 'movie',
          tmdbId: movieIdToUpdate,
          contentType: 'movie',
          genres: movieDetails.genres?.map(g => g.name) || [],
          releaseYear: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : undefined,
          runtime: movieDetails.runtime || 120
        });
      }
      setLogStatus(newType);
      // Toast bildirimi göster
      setShowToast(true);
    }
  };

  const handleWatchedToggle = () => {
    const movieIdToUpdate = selectedMovieId || movieId;
    if (!movieIdToUpdate || !movieDetails) return;

    const newType = logStatus === 'watched' ? null : 'watched';
    
    if (newType === null) {
      // Kaydı sil
      const logs = LocalStorageService.getMovieLogs();
      const logToDelete = logs.find(log => log.tmdbId === movieIdToUpdate && log.mediaType === 'movie');
      if (logToDelete) {
        LocalStorageService.deleteMovieLog(logToDelete.id);
      }
      setLogStatus(null);
    } else {
      // Önce mevcut kaydı güncellemeyi dene
      let updatedLog = LocalStorageService.updateLogTypeByTmdbId(movieIdToUpdate, newType, 'movie');
      
      if (!updatedLog) {
        // Kayıt yoksa yeni kayıt oluştur
        updatedLog = LocalStorageService.saveMovieLog({
          title: movieDetails.title,
          date: new Date().toISOString().split('T')[0],
          rating: '',
          review: '',
          poster: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : '',
          type: newType,
          mediaType: 'movie',
          tmdbId: movieIdToUpdate,
          contentType: 'movie',
          genres: movieDetails.genres?.map(g => g.name) || [],
          releaseYear: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : undefined,
          runtime: movieDetails.runtime || 120
        });
      }
      setLogStatus(newType);
      
      // Toast bildirimi göster
      if (newType === 'watched') {
        setShowToast(true);
      }
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hr ${mins} min`;
  };

  const formatYear = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear().toString();
  };

  if (!open) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full h-full bg-[#0C1117] overflow-y-auto">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="absolute top-12 left-4 z-10 w-6 h-6 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="#F8F8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Action Buttons - Sağ Üst */}
        <div className="absolute top-12 right-4 z-10 flex gap-2">
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
            <div className="text-white font-poppins">{t('movie_detail_modal.loading')}</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-400 font-poppins">{t('movie_detail_modal.error')}</div>
          </div>
        ) : movieDetails ? (
          <>
            {/* Poster Background */}
            <div className="relative h-[424px] w-full">
              <img
                src={movieDetails.backdrop_path ? `https://image.tmdb.org/t/p/w500${movieDetails.backdrop_path}` : 'https://placehold.co/393x424?text=No+Image'}
                alt={movieDetails.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80"></div>
            </div>

            {/* Content Container */}
            <div className="relative -mt-16 px-[18px] pb-20">
              <div className="bg-[#0C1117] rounded-t-[24px] p-4 pb-8">
                {/* Movie Title and Genres */}
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-[#F8F8FF] font-poppins font-extrabold text-2xl leading-6 drop-shadow-[0_4px_15px_rgba(255,255,255,0.7)]">
                    {movieDetails.title}
                  </h1>
                  <div className="flex gap-1">
                    {movieDetails.genres?.slice(0, 2).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-1 py-0.5 bg-[rgba(254,119,67,0.5)] rounded-lg text-[#F8F8FF] text-[10px] font-poppins font-medium"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Year and Runtime */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#F8F8FF] font-poppins font-semibold text-base drop-shadow-[0_8px_15px_rgba(255,255,255,0.7)]">
                    {formatYear(movieDetails.release_date)}
                  </span>
                  <div className="w-2.5 h-2.5 bg-[#F8F8FF] rounded-full drop-shadow-[0_8px_15px_rgba(255,255,255,0.7)]"></div>
                  <span className="text-[#F8F8FF] font-poppins font-semibold text-base drop-shadow-[0_8px_15px_rgba(255,255,255,0.7)]">
                    {movieDetails.runtime ? formatRuntime(movieDetails.runtime) : ''}
                  </span>
                </div>



                {/* Rating */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FE7743] rounded-xl mb-2 drop-shadow-[0_4px_15px_rgba(255,255,255,0.5)]">
                  <span className="text-[#F8F8FF] font-poppins text-xs">{t('movie_detail_modal.imdb_rating')}</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[#F8F8FF] font-poppins text-sm">
                      {movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : 'N/A'}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#F8F8FF">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                </div>

                {/* Overview */}
                <p className="text-[#EFEEEA] font-poppins text-xs leading-6 mb-4">
                  {movieDetails.overview || t('movie_detail_modal.no_overview')}
                </p>

                {/* Cast Section */}
                <div className="mb-4">
                  <h2 className="text-[#EFEEEA] font-poppins font-bold text-2xl mb-1">{t('movie_detail_modal.stars')}</h2>
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
                          {member.name.split(' ').slice(0, 2).join('\n')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Watch Trailer Section */}
                <div className="mb-4">
                  <h2 className="text-[#F8F8FF] font-poppins font-bold text-2xl mb-2">{t('movie_detail_modal.watch_trailer')}</h2>
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
                      <span className="text-[#F8F8FF] font-poppins">{t('movie_detail_modal.trailer_not_found')}</span>
                    </div>
                  )}
                </div>

                {/* Liked Others Section */}
                <div className="mb-6">
                  <h2 className="text-[#F8F8FF] font-poppins font-bold text-2xl mb-2">{t('movie_detail_modal.liked_others')}</h2>
                  <div className="flex gap-3 overflow-x-auto pb-4">
                    {similarMovies.slice(0, 5).map((movie) => (
                      <div 
                        key={movie.id} 
                        className="w-[90px] h-[135px] bg-gray-800 rounded-lg border border-white flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleSimilarMovieClick(movie.id)}
                      >
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/90x135?text=No+Image'}
                          alt={movie.title}
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

        {/* Actor Detail Modal */}
        <ActorDetailModal
          open={actorModalOpen}
          onClose={handleActorModalClose}
          actorId={selectedActorId}
          onMovieClick={handleSimilarMovieClick}
        />

        {/* Add Movie Modal */}
        <AddButtonModal
          open={showAddMovieModal}
          onClose={() => {
            setShowAddMovieModal(false);
            setPrefillData(null);
          }}
          onSave={(log?: MovieLog) => {
            setShowAddMovieModal(false);
            setPrefillData(null);
            // Başarı mesajı göster
            console.log('Film puan ve yorum ile güncellendi:', log);
          }}
          onAddMovieLog={(log: MovieLog) => {
            // Film log'unu güncelle
            if (log && movieDetails) {
              LocalStorageService.updateMovieLog(log.id, {
                rating: log.rating,
                review: log.review
              });
            }
          }}
          prefillData={prefillData}
        />

        {/* Toast Notification */}
        <ToastNotification
          isOpen={showToast}
          onClose={() => setShowToast(false)}
          messageKey={
            logStatus === 'watchlist' 
              ? 'toast.movie_added_to_watchlist'
              : logStatus === 'watched'
              ? 'toast.movie_marked_as_watched'
              : 'toast.movie_removed_from_watchlist'
          }
          messageParams={movieDetails ? { title: movieDetails.title } : { title: 'Film' }}
          type="success"
          duration={3000}
        />
      </div>
    </div>
  );
};

export default MovieDetailModal;