import { useEffect, useMemo, useState } from 'react';
import {
	ArrowLeft,
	Award,
	Calendar,
	Crown,
	Flame,
	Mail,
	MapPin,
	Star,
	Trophy,
	Zap,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import BadgeImage from './components/BadgeImage';
import LoadingSpinner from './components/LoadingSpinner';
import apiClient from './services/apiClient';
import './css/PerfilPublico.css';
import { fetchPublicProfile } from './services/consultorService';

const normalizeLevelId = (level) => {
  const normalized = String(level || '').trim().toLowerCase();
  if (normalized.includes('júnior') || normalized.includes('junior')) return 'junior';
  if (normalized.includes('intermédio') || normalized.includes('intermedio')) return 'intermediate';
  if (normalized.includes('sénior') || normalized.includes('senior')) return 'senior';
  if (normalized.includes('especialista')) return 'specialist';
  if (normalized.includes('líder') || normalized.includes('lider')) return 'knowledge_lead';
  return null;
};

const defaultConsultor = {
	id: '',
	name: '',
	email: '',
	serviceLine: '',
	points: 0,
	badges: 0,
	streakDays: 0,
	location: '',
	joined: '',
};

function PerfilPublico() {
	const { consultorId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();

		const [remoteConsultor, setRemoteConsultor] = useState(null);
		const [vitrineItems, setVitrineItems] = useState([]);
		const [isLoading, setIsLoading] = useState(true);

		const consultor = useMemo(() => {
			if (remoteConsultor) {
				return {
					...(location.state?.consultor || {}),
					...remoteConsultor,
				};
			}

			if (location.state?.consultor) {
				return location.state.consultor;
			}

			return defaultConsultor;
		}, [consultorId, location.state, remoteConsultor]);

		useEffect(() => {
			let isMounted = true;
			const loadPublicProfile = async () => {
				try {
					const decodedId = decodeURIComponent(consultorId || '');
					if (!decodedId) return;
					const data = await fetchPublicProfile(decodedId);
					if (!isMounted || !data) return;

					// Map server profile structure to expected consultor shape used in this page
				const mapped = {
					id: data.user?.id ?? data.id ?? decodedId,
					name: data.user?.name ?? data.nome ?? data.user?.nome ?? '',
					email: data.user?.email ?? data.email ?? '',
					serviceLine: data.serviceLine ?? data.user?.serviceLine ?? '',
					points: data.points ?? 0,
					badges: data.badges ?? 0,
					avatar: data.avatar ?? data.user?.avatar ?? null,
					streakDays: data.streakDays ?? 0,
					ranking: data.ranking ?? 0,
					serviceLineStats: Array.isArray(data.serviceLineStats) ? (() => {
						const merged = {};
						(data.serviceLineStats || []).forEach((s) => {
							const key = (s.serviceLine || s.name || s.serviceline || '').trim().toLowerCase() || 'application operations';
							if (!merged[key]) {
								merged[key] = {
									serviceLine: s.serviceLine || s.name || s.serviceline || 'Application Operations',
									badges: 0,
									points: 0,
								};
							}
							merged[key].badges += Number(s.badges) || 0;
							merged[key].points += Number(s.points) || 0;
						});
						return Object.values(merged);
					})() : [],
					activityItems: Array.isArray(data.activityItems) ? data.activityItems.map((item) => ({
						id: item.id ?? `activity-${Math.random()}`,
						description: item.description ?? '',
						date: item.date ?? '',
						icon: Award,
						})) : [],
						location: data.location ?? '',
						joined: data.joined ?? data.user?.joined ?? '',
							certificationsItems: Array.isArray(data.certificationsItems) ? data.certificationsItems
								.map((item) => ({
									title: item.title || item.name || '',
									levelKey: item.levelKey || item.subtitleKey || '',
								}))
								.filter((it) => it.title) : [],
					};

					setRemoteConsultor(mapped);

					try {
						const accountId = data.user?.id || data.id;
						if (accountId) {
							const vitrineRes = await apiClient.get('/consultor/vitrine', { params: { accountId } });
							if (isMounted && Array.isArray(vitrineRes.data) && vitrineRes.data.length > 0) {
								const mapped2 = vitrineRes.data.map((v) => {
									const isSpecial = v.tipo === 'Especial';
									const resolvedLevelId = isSpecial ? 'special' : normalizeLevelId(v.nivel);
									const typeId = resolvedLevelId
										? (resolvedLevelId === 'special' ? 'special' : `badge_level_${resolvedLevelId}`)
										: undefined;
									return {
										id: `vitrine-${v.nbadge}`,
										badgeDbId: v.nbadge,
										name: v.b_nome || 'Badge',
										badgeImage: v.imagem || null,
										points: v.pontos || 0,
										isSpecial,
										levelKey: resolvedLevelId || undefined,
										typeId,
										levelLabel: v.nivel || (isSpecial ? 'Especial' : undefined),
									};
								});
								setVitrineItems(mapped2);
							}
						}
					} catch { /* no vitrine */ }

					if (isMounted) setIsLoading(false);
				} catch (e) {
					if (isMounted) setIsLoading(false);
				}
			};

			loadPublicProfile();

			return () => { isMounted = false; };
		}, [consultorId]);

	const profileStats = useMemo(() => {
		const rankingPosition = consultor.ranking || 0;

		return [
			{ id: 'badges', title: t('dashboard_stat_badges_title'), value: consultor.badges, icon: Award, tone: 'gold' },
			{ id: 'points', title: t('points'), value: consultor.points, icon: Trophy, tone: 'blue' },
			{ id: 'streak', title: t('dashboard_stat_streak_title'), value: consultor.streakDays || 0, icon: Flame, tone: 'fire' },
			{ id: 'ranking', title: t('dashboard_stat_ranking_title'), value: `#${rankingPosition > 0 ? rankingPosition : '-'}`, icon: Crown, tone: 'rank' },
		];
	}, [consultor, t]);

	const hasServiceLineStats = Array.isArray(consultor.serviceLineStats)
		&& consultor.serviceLineStats.length > 0;

	const activityItems = useMemo(() => {
		if (Array.isArray(consultor.activityItems) && consultor.activityItems.length > 0) {
			return consultor.activityItems;
		}

		return [
			{ id: 'a1', description: `Subiu para ${consultor.badges} badges concluidas`, date: '5 dias atras', icon: Award },
			{ id: 'a2', description: `Alcancou ${consultor.points} pontos`, date: '1 semana atras', icon: Zap },
			{ id: 'a3', description: `Nova skill em ${consultor.serviceLine}`, date: '2 semanas atras', icon: Star },
		];
	}, [consultor.activityItems, consultor.badges, consultor.points, consultor.serviceLine]);

	const handleGoBack = () => {
		navigate('/galeria-publica');
	};

	if (isLoading) {
		return (
			<div className="pp-root">
				<Navbar />
				<LoadingSpinner fullPage message="A carregar perfil..." />
			</div>
		);
	}

	return (
		<div className="pp-root">
			<Navbar />

			<main className="pp-main">
				<section className="pp-shell">
					<div className="pp-page">
						<header className="pp-header">
							<button type="button" className="pp-back-btn" onClick={handleGoBack} aria-label={t('back')}>
								<ArrowLeft size={22} />
							</button>
							<h1>{t('profile_title')}</h1>
						</header>

						<section className="pp-profile-hero">
							<div className="pp-avatar-wrap">
								<img
									src={consultor.avatar || `/avatars/default-avatar.svg`}
									alt={consultor.name}
									className="pp-avatar"
								/>
							</div>

							<div className="pp-profile-info">
								<h2>{consultor.name}</h2>
								<p>{consultor.serviceLine}</p>

								<div className="pp-profile-meta">
									<span><Mail size={16} /> {consultor.email}</span>
									{consultor.location && <span><MapPin size={16} /> {consultor.location}</span>}
									{consultor.joined && <span><Calendar size={16} /> Joined {consultor.joined}</span>}
								</div>
							</div>
						</section>

						<section className="pp-stats-grid">
							{profileStats.map((item) => {
								const StatIcon = item.icon;

								return (
									<article key={item.id} className={`pp-stat-card tone-${item.tone}`}>
										<div className="pp-stat-title">{item.title}</div>
										<div className="pp-stat-body">
											<span className="pp-stat-icon">
												<StatIcon size={30} strokeWidth={2} />
											</span>
											<strong>{item.value}</strong>
										</div>
									</article>
								);
							})}
						</section>

						<div className="pp-panels-grid">
							<section className="pp-panel-card">
								<div className="pp-panel-header">
									<h3>{t('profile_skills')}</h3>
								</div>

								{hasServiceLineStats ? (
									<div className="pp-service-line-stats">
										{(() => {
											const uniqueStats = Object.values(
												(consultor.serviceLineStats || []).reduce((acc, s) => {
													const k = (s.serviceLine || '').trim().toLowerCase() || 'application operations';
													if (!acc[k]) acc[k] = { ...s };
													else {
														acc[k].badges += Number(s.badges) || 0;
														acc[k].points += Number(s.points) || 0;
													}
													return acc;
												}, {})
											);
											const maxBadges = Math.max(...uniqueStats.map((s) => s.badges || 0), 1);
											return uniqueStats.map((stat, idx) => {
												const percentage = ((stat.badges || 0) / maxBadges) * 100;
												return (
													<article key={`sl-${idx}-${stat.serviceLine}`} className="pp-service-line-item">
														<div className="pp-service-line-header">
															<strong>{stat.serviceLine || 'Service Line'}</strong>
															<span className="pp-service-line-meta">
																{stat.badges || 0} badge{stat.badges !== 1 ? 's' : ''} · {stat.points || 0} pts
															</span>
														</div>
														<div className="pp-progress-bar-bg">
															<div
																style={{ width: `${percentage}%` }}
																className="pp-progress-bar-fill"
															/>
														</div>
													</article>
												);
										});
									})()}
									</div>
									) : (
										<p className="pp-service-line-empty">{t('profile_skills_empty')}</p>
									)}
							</section>

						{vitrineItems.length > 0 && (
							<section className="pp-panel-card">
								<div className="pp-panel-header">
									<h3>Vitrine</h3>
								</div>
								<div className="pp-vitrine-grid">
								{vitrineItems.map((badge) => (
									<div
										key={badge.id}
										className="pp-vitrine-item"
										title={badge.name}
										role="button"
										tabIndex={0}
										onClick={() => navigate(`/galeria-publica/badge/${encodeURIComponent(badge.badgeDbId)}`, { state: { badge } })}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												navigate(`/galeria-publica/badge/${encodeURIComponent(badge.badgeDbId)}`, { state: { badge } });
											}
										}}
									>
											<div className="pp-vitrine-badge-img">
												<BadgeImage
													src={badge.badgeImage}
													alt={badge.name || 'Badge'}
													levelKey={badge.levelKey}
													typeId={badge.typeId}
													levelLabel={badge.levelLabel}
												/>
											</div>
											<span className="pp-vitrine-badge-name">{badge.name}</span>
										</div>
									))}
								</div>
							</section>
						)}
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}

export default PerfilPublico;
