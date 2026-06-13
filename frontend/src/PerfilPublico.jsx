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
import './css/PerfilPublico.css';
import { fetchPublicProfile } from './services/consultorService';

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
						id: data.user?.id || data.id || decodedId,
						name: data.user?.name || data.nome || data.user?.nome || 'Consultor',
						email: data.user?.email || data.email || '',
						serviceLine: data.serviceLine || (data.user?.serviceLine) || 'Service Line',
						points: data.points || 0,
						badges: data.badges || 0,
						avatar: data.avatar || data.user?.avatar || '',
					streakDays: data.streakDays || 0,
						ranking: data.ranking || 0,
					serviceLineStats: Array.isArray(data.serviceLineStats) ? data.serviceLineStats.map((s) => ({
						serviceLine: s.serviceLine || s.name || s.serviceline,
						badges: Number(s.badges) || 0,
						points: Number(s.points) || 0,
					})) : [],
					activityItems: Array.isArray(data.activityItems) ? data.activityItems.map((item) => ({
						id: item.id || `activity-${Math.random()}`,
						description: item.description || 'Nova atividade',
						date: item.date || 'Recentemente',
						icon: Award,
						})) : [],
						location: data.location || 'Portugal',
						joined: data.joined || data.user?.joined || '',
							certificationsItems: Array.isArray(data.certificationsItems) ? data.certificationsItems
								.map((item) => ({
									title: item.title || item.name || '',
									levelKey: item.levelKey || item.subtitleKey || '',
								}))
								.filter((it) => it.title) : [],
					};

					setRemoteConsultor(mapped);
				} catch (e) {
					// ignore and keep fallback
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

	const skillsItems = useMemo(() => {
		if (!Array.isArray(consultor.skillsItems)) {
			return [];
		}

		return consultor.skillsItems
			.map((item) => ({
				title: item.title || item.name || '',
				levelKey: item.levelKey || item.subtitleKey || '',
				meta: item.meta || item.subtitle || '',
			}))
			.filter((item) => item.title);
	}, [consultor.skillsItems]);

	const certificationsItems = useMemo(() => {
		if (!Array.isArray(consultor.certificationsItems)) {
			return [];
		}

		return consultor.certificationsItems
			.map((item) => ({
				title: item.title || item.name || '',
				levelKey: item.levelKey || item.subtitleKey || '',
			}))
			.filter((item) => item.title);
	}, [consultor.certificationsItems]);

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
									src={consultor.avatar || `https://i.pravatar.cc/160?u=${consultor.email || consultor.name}`}
									alt={consultor.name}
									className="pp-avatar"
								/>
							</div>

							<div className="pp-profile-info">
								<h2>{consultor.name}</h2>
								<p>{consultor.serviceLine}</p>

								<div className="pp-profile-meta">
									<span><Mail size={16} /> {consultor.email}</span>
									<span><MapPin size={16} /> {consultor.location || 'Portugal'}</span>
									<span><Calendar size={16} /> Joined {consultor.joined || '2023'}</span>
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
											const maxBadges = Math.max(...consultor.serviceLineStats.map((s) => s.badges || 0), 1);
											return consultor.serviceLineStats.map((stat) => {
												const percentage = ((stat.badges || 0) / maxBadges) * 100;
												return (
													<article key={`sl-${stat.serviceLine}`} className="pp-service-line-item">
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
										skillsItems.length > 0 ? (
											<div className="pp-list">
												{skillsItems.map(({ title, levelKey, meta }) => (
													<article key={`${title}-${levelKey}`} className="pp-list-item">
														<div className="pp-list-badge">
															<Award size={18} strokeWidth={2} />
														</div>
														<div className="pp-list-content">
															<strong>{title}</strong>
															<span>
															  {t(levelKey)}{meta ? ` · ${meta}` : ''}
															</span>
														</div>
													</article>
												))}
											</div>
										) : (
											<p className="pp-service-line-empty">{t('profile_skills_empty')}</p>
										)
									)}
							</section>

							<section className="pp-panel-card">
								<div className="pp-panel-header">
									<h3>{t('profile_certifications')}</h3>
								</div>

								{certificationsItems.length > 0 ? (
									<div className="pp-list">
										{certificationsItems.map(({ title, levelKey }) => (
											<article key={`${title}-${levelKey}`} className="pp-list-item">
												<div className="pp-list-badge">
													<Trophy size={18} strokeWidth={2} />
												</div>
												<div className="pp-list-content">
													<strong>{title}</strong>
													<span>{t(levelKey)}</span>
												</div>
											</article>
										))}
									</div>
								) : (
									<p className="pp-service-line-empty">{t('profile_certifications_empty')}</p>
								)}
							</section>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}

export default PerfilPublico;
