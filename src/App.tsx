/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, FileText, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

type FirestoreProject = {
  id: string;
  Project_title: string;
  Project_description: string;
  Project_date?: string;
  Project_photos?: string[];
  Project_framework: string;
  Project_skils?: string[];
  Project_icon?: string;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isProjectsPage = location.pathname === "/projects";
  const detailsPathMatch = location.pathname.match(/^\/projects\/([^/]+)$/);
  const selectedProjectId = detailsPathMatch ? decodeURIComponent(detailsPathMatch[1]) : "";
  const isProjectDetailsPage = Boolean(detailsPathMatch);
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  useEffect(() => {
    if (!isProjectsPage && !isProjectDetailsPage) return;

    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      setProjectsError("");

      try {
        const projectsRef = collection(db, "Projects");
        const projectsQuery = query(projectsRef, orderBy("Project_date", "desc"));
        const snapshot = await getDocs(projectsQuery);

        const firestoreProjects = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            Project_title: String(data.Project_title ?? ""),
            Project_description: String(data.Project_description ?? ""),
            Project_date: data.Project_date ? String(data.Project_date) : "",
            Project_photos: Array.isArray(data.Project_photos)
              ? data.Project_photos.map((photo: unknown) => String(photo))
              : [],
            Project_framework: String(data.Project_framework ?? ""),
            Project_skils: Array.isArray(data.Project_skils)
              ? data.Project_skils.map((skill: unknown) => String(skill))
              : Array.isArray(data.Project_skills)
                ? data.Project_skills.map((skill: unknown) => String(skill))
                : [],
            Project_icon: String(data["Project Icon"] ?? data.Project_icon ?? ""),
          };
        });

        setProjects(firestoreProjects);
      } catch (error) {
        console.error("Failed to fetch projects from Firestore", error);
        setProjectsError("Unable to load projects. Check your Firebase config and Firestore rules.");
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [isProjectDetailsPage, isProjectsPage]);

  useEffect(() => {
    setActivePhotoIndex(null);
  }, [selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  if (isProjectDetailsPage) {
    const projectPhotos = selectedProject?.Project_photos ?? [];
    const galleryPhotos = projectPhotos.filter((photo) => Boolean(photo));
    const mainPhoto = projectPhotos[0] ?? "";
    const sidePhotos = projectPhotos.slice(1, 3);
    const activePhoto =
      activePhotoIndex !== null && galleryPhotos[activePhotoIndex] ? galleryPhotos[activePhotoIndex] : "";

    const openPhotoViewer = (photo: string) => {
      const index = galleryPhotos.indexOf(photo);
      if (index !== -1) {
        setActivePhotoIndex(index);
      }
    };

    const showPreviousPhoto = () => {
      if (activePhotoIndex === null || galleryPhotos.length === 0) return;
      setActivePhotoIndex((activePhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length);
    };

    const showNextPhoto = () => {
      if (activePhotoIndex === null || galleryPhotos.length === 0) return;
      setActivePhotoIndex((activePhotoIndex + 1) % galleryPhotos.length);
    };

    return (
      <div className="relative min-h-screen w-full bg-surface selection:bg-primary/30 selection:text-primary flex flex-col overflow-x-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] md:w-[780px] md:h-[780px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
          <button
            onClick={() => navigate("/projects")}
            className="inline-flex items-center gap-2 text-sm text-outline/80 hover:text-on-surface transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to projects
          </button>

          {isLoadingProjects && (
            <div className="rounded-sm border border-outline/10 bg-surface-dim/60 px-4 sm:px-6 py-5 sm:py-6 text-outline/80">
              Loading project details...
            </div>
          )}

          {!isLoadingProjects && projectsError && (
            <div className="rounded-sm border border-red-300/20 bg-red-500/5 px-4 sm:px-6 py-5 sm:py-6 text-red-200/90">
              {projectsError}
            </div>
          )}

          {!isLoadingProjects && !projectsError && !selectedProject && (
            <div className="rounded-sm border border-outline/10 bg-surface-dim/60 px-4 sm:px-6 py-5 sm:py-6 text-outline/80">
              Project details are unavailable.
            </div>
          )}

          {!isLoadingProjects && !projectsError && selectedProject && (
            <section className="space-y-8 sm:space-y-10">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-outline/15 bg-surface-bright/70 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                  {selectedProject.Project_framework || "Project"}
                </span>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-on-surface leading-tight">
                  {selectedProject.Project_title}
                </h1>
              </div>

              {(mainPhoto || sidePhotos.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                  {mainPhoto ? (
                    <button
                      type="button"
                      onClick={() => openPhotoViewer(mainPhoto)}
                      className="group cursor-zoom-in"
                      aria-label={`Open ${selectedProject.Project_title} main screenshot`}
                    >
                      <img
                        src={mainPhoto}
                        alt={`${selectedProject.Project_title} screenshot`}
                        className="w-full h-[280px] sm:h-[360px] md:h-full max-h-[440px] rounded-lg border border-outline/10 object-cover transition-transform group-hover:scale-[1.01]"
                      />
                    </button>
                  ) : (
                    <div className="w-full h-[280px] sm:h-[360px] md:h-full max-h-[440px] rounded-lg border border-outline/10 bg-surface-bright/20" />
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    {sidePhotos.map((photo, index) => (
                      <button
                        type="button"
                        key={photo}
                        onClick={() => openPhotoViewer(photo)}
                        className="group cursor-zoom-in"
                        aria-label={`Open ${selectedProject.Project_title} extra screenshot ${index + 1}`}
                      >
                        <img
                          src={photo}
                          alt={`${selectedProject.Project_title} extra screenshot ${index + 1}`}
                          className="w-full h-[130px] sm:h-[170px] rounded-lg border border-outline/10 object-cover transition-transform group-hover:scale-[1.01]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-5">Full Description</h2>
                  <div className="h-[3px] w-20 bg-primary/80 rounded-full mb-7" />
                  <p className="text-sm sm:text-[16px] text-outline/80 leading-[1.9] whitespace-pre-line">
                    {selectedProject.Project_description}
                  </p>
                </div>

                <aside className="rounded-sm border border-outline/10 bg-surface-dim/60 px-5 py-6 h-fit space-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-outline/50 mb-2">Skils</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.Project_skils && selectedProject.Project_skils.length > 0 ? (
                        selectedProject.Project_skils.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-[11px] rounded-sm bg-surface-bright/90 border border-outline/15 text-outline/70"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-outline/55">No skils added yet.</span>
                      )}
                    </div>
                  </div>

                  {selectedProject.Project_date && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-outline/50 mb-2">Project Timeline</p>
                      <p className="text-sm text-on-surface">{selectedProject.Project_date}</p>
                    </div>
                  )}
                </aside>
              </div>
            </section>
          )}
        </main>

        {activePhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 p-4 sm:p-8 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setActivePhotoIndex(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 h-10 w-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-white/45 flex items-center justify-center transition-colors"
              aria-label="Close image viewer"
            >
              <X size={18} />
            </button>

            {galleryPhotos.length > 1 && (
              <button
                type="button"
                onClick={showPreviousPhoto}
                className="absolute left-3 sm:left-6 h-10 w-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-white/45 flex items-center justify-center transition-colors"
                aria-label="Previous image"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <img
              src={activePhoto}
              alt={`${selectedProject?.Project_title ?? "Project"} full screenshot`}
              className="max-h-[86vh] max-w-[96vw] object-contain rounded-md"
            />

            {galleryPhotos.length > 1 && (
              <button
                type="button"
                onClick={showNextPhoto}
                className="absolute right-3 sm:right-6 h-10 w-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-white/45 flex items-center justify-center transition-colors"
                aria-label="Next image"
              >
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isProjectsPage) {
    return (
      <div className="relative min-h-screen w-full bg-surface selection:bg-primary/30 selection:text-primary flex flex-col overflow-x-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] md:w-[780px] md:h-[780px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-outline/80 hover:text-on-surface transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>

          <div className="mb-8 sm:mb-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-outline/65 mb-2">
              TECHNICAL SHOWCASE
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-on-surface leading-tight">
              Projects
            </h1>
            <div className="mt-4 h-[3px] w-20 bg-primary/80 rounded-full" />
          </div>

          <section className="space-y-3 sm:space-y-4">
            {isLoadingProjects && (
              <div className="rounded-sm border border-outline/10 bg-surface-dim/60 px-4 sm:px-6 py-5 sm:py-6 text-outline/80">
                Loading projects...
              </div>
            )}

            {!isLoadingProjects && projectsError && (
              <div className="rounded-sm border border-red-300/20 bg-red-500/5 px-4 sm:px-6 py-5 sm:py-6 text-red-200/90">
                {projectsError}
              </div>
            )}

            {!isLoadingProjects && !projectsError && projects.length === 0 && (
              <div className="rounded-sm border border-outline/10 bg-surface-dim/60 px-4 sm:px-6 py-5 sm:py-6 text-outline/80">
                No projects found in the `Projects` collection yet.
              </div>
            )}

            {!isLoadingProjects &&
              !projectsError &&
              projects.map((project) => {
                const projectIcon = project.Project_icon || project.Project_photos?.[0];

                return (
                  <article
                    key={project.id}
                    className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 rounded-sm border border-outline/10 bg-surface-dim/60 px-4 sm:px-6 py-5 sm:py-6"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0 lg:w-[50%]">
                      {projectIcon && (
                        <img
                          src={projectIcon}
                          alt={`${project.Project_title} icon`}
                          className="h-14 w-14 rounded-lg border border-outline/10 object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex items-center gap-3 sm:gap-4 flex-wrap">
                        <h2 className="font-display text-2xl sm:text-[30px] tracking-tight text-on-surface leading-none">
                          {project.Project_title}
                        </h2>
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm bg-surface-bright/90 border border-outline/15 text-outline/70">
                          {project.Project_framework}
                        </span>
                        {project.Project_date && (
                          <span className="text-[11px] text-outline/55">
                            {project.Project_date}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm sm:text-[15px] text-outline/80 leading-relaxed lg:flex-1 line-clamp-2">
                      {project.Project_description}
                    </p>

                    <button
                      onClick={() => navigate(`/projects/${encodeURIComponent(project.id)}`)}
                      className="self-end lg:self-center h-9 w-9 flex items-center justify-center rounded-full border border-outline/15 text-outline/70 hover:text-on-surface hover:border-primary/50 transition-colors cursor-pointer"
                      aria-label={`Open details for ${project.Project_title}`}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </article>
                );
              })}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-surface selection:bg-primary/30 selection:text-primary flex flex-col overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] md:w-[800px] md:h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Content Area (Centered) */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl"
        >
          <motion.span
            variants={itemVariants}
            className="inline-block font-display text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-outline/60 mb-5 sm:mb-6"
          >
            Mobile Developer
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="text-[clamp(2rem,8vw,4.5rem)] font-bold text-on-surface mb-6 sm:mb-8 heading-glow leading-tight"
          >
            Youssef Ahmed Rabiea
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base md:text-lg text-outline/80 mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto font-sans"
          >
            Cross-platform mobile developer using Flutter. Crafting high-performance, beautiful mobile experiences with architectural precision.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <button
              onClick={() => navigate("/projects")}
              className="flex items-center justify-center gap-3 px-6 sm:px-10 py-3.5 bg-primary/90 text-on-primary font-semibold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/10 cursor-pointer text-sm w-full sm:w-auto"
            >
              <Eye size={18} strokeWidth={2.5} />
              Watch my projects
            </button>
            <a
              href="https://drive.google.com/file/d/1BgYgWpWNxUSVYkBRl7nJDYQgRRg2ufCm/view?usp=drive_link"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 px-6 sm:px-10 py-3.5 bg-transparent text-on-surface font-semibold rounded-lg border border-outline/20 hover:bg-surface-bright/20 transition-all cursor-pointer text-sm w-full sm:w-auto"
            >
              <FileText size={18} strokeWidth={2.5} />
              See my CV
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* Contact & Footer Area (Bottom) */}
      <footer className="w-full px-4 sm:px-6 lg:px-12 pb-8 sm:pb-10 z-10">
        <div className="max-w-[1400px] mx-auto border-t border-outline/5 pt-8 sm:pt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            {/* Left side */}
            <div className="space-y-2 text-left">
              <h2 className="text-xl sm:text-2xl font-semibold text-on-surface tracking-tight">Get in touch</h2>
              <p className="text-outline/60 text-sm">Available for freelance and full-time opportunities.</p>
            </div>

            {/* Right side contact details */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 md:gap-16 text-left sm:text-right w-full md:w-auto">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-outline/40 block">Phone / WhatsApp</span>
                <a href="tel:01152272859" className="text-sm sm:text-base text-on-surface hover:text-primary transition-colors block break-all sm:break-normal">01152272859</a>
              </div>
              <div className="space-y-1 text-left sm:text-right">
                <span className="text-[10px] uppercase tracking-widest text-outline/40 block">Email</span>
                <a href="mailto:youssefahmed3047@gmail.com" className="text-sm sm:text-base text-on-surface hover:text-primary transition-colors block break-all sm:break-normal">youssefahmed3047@gmail.com</a>
              </div>
              <div className="space-y-1 text-left sm:text-right">
                <span className="text-[10px] uppercase tracking-widest text-outline/40 block">GitHub</span>
                <a
                  href="https://github.com/youssefahmed3047"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm sm:text-base text-on-surface hover:text-primary transition-colors block break-all sm:break-normal"
                >
                  github.com/youssefahmed3047
                </a>
              </div>
              <div className="space-y-1 text-left sm:text-right">
                <span className="text-[10px] uppercase tracking-widest text-outline/40 block">LinkedIn</span>
                <a
                  href="https://www.linkedin.com/in/youssef-ahmed-8b3565376/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm sm:text-base text-on-surface hover:text-primary transition-colors block break-all sm:break-normal"
                >
                  linkedin.com/in/youssef-ahmed-8b3565376
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 sm:mt-16 text-center text-outline/20 text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            © 2024 YOUSSEF AHMED RABIEA
          </div>
        </div>
      </footer>
    </div>
  );
}
