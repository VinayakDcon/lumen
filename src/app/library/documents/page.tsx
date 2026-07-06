"use client";

import React, { useState, useMemo } from "react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useActiveProgrammeQuery, useDocumentsQuery } from "@/hooks/use-pmo-queries";
import { 
  FileText, Search, Plus, Edit3, X, RefreshCw, Link as LinkIcon
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ProjectDocument } from "@/types/pmo";

export default function DocumentsPage() {
  const activeProgrammeId = usePmoStore((state) => state.activeProgrammeId);
  const addDocument = usePmoStore((state) => state.addDocument);
  const updateDocument = usePmoStore((state) => state.updateDocument);
  const currentUser = usePmoStore((state) => state.user);
  
  const { data: activeProgramme, isLoading: isProgLoading } = useActiveProgrammeQuery(activeProgrammeId);
  const { data: documents = [], isLoading: isDocsLoading } = useDocumentsQuery(activeProgrammeId);

  const isLoading = isProgLoading || isDocsLoading;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ProjectDocument | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("Design");
  const [formVersion, setFormVersion] = useState("v1.0");
  const [formStatus, setFormStatus] = useState<ProjectDocument["status"]>("DRAFT");
  const [formReviewer, setFormReviewer] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formLink, setFormLink] = useState("");

  // Unique types for dropdown
  const types = useMemo(() => Array.from(new Set(documents.map(d => d.type))), [documents]);

  // Filtered Docs
  const filteredDocs = useMemo(() => {
    return documents
      .filter((d) => {
        const matchesSearch = 
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.tags.join(" ").toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = !typeFilter || d.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => b.id - a.id);
  }, [documents, searchQuery, typeFilter]);

  // Open modal
  const handleOpenModal = (doc?: ProjectDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormTitle(doc.title);
      setFormType(doc.type);
      setFormVersion(doc.version);
      setFormStatus(doc.status);
      setFormReviewer(doc.reviewer || "");
      setFormTags(doc.tags.join(", "));
      setFormLink(doc.link_url || "");
    } else {
      setEditingDoc(null);
      setFormTitle("");
      setFormType("Design");
      setFormVersion("v1.0");
      setFormStatus("DRAFT");
      setFormReviewer("");
      setFormTags("");
      setFormLink("");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tagsArray = formTags.split(",").map(t => t.trim()).filter(t => t.length > 0);

    if (editingDoc) {
      updateDocument(editingDoc.id, {
        title: formTitle,
        type: formType,
        version: formVersion,
        status: formStatus,
        reviewer: formReviewer || null,
        tags: tagsArray,
        link_url: formLink || null,
      });
    } else {
      addDocument({
        programme_id: activeProgrammeId,
        title: formTitle,
        type: formType,
        version: formVersion,
        status: formStatus,
        author: currentUser?.name || "System",
        reviewer: formReviewer || null,
        tags: tagsArray,
        link_url: formLink || null,
      });
    }
    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "RELEASED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REVIEW": return "bg-sky-50 text-sky-700 border-sky-200";
      case "OBSOLETE": return "bg-rose-50 text-rose-700 border-rose-200";
      case "DRAFT": return "bg-slate-100 text-slate-600 border-slate-300";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-dc-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium font-sans">Loading Documents...</span>
        </div>
      </div>
    );
  }

  if (!activeProgramme) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <RefreshCw className="w-16 h-16 text-slate-350 mb-4" />
        <h2 className="text-lg font-bold text-navy mb-2">No Active Programme</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Please select a programme to view and manage project documents.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <FileText className="w-6 h-6 text-dc-blue" />
            Document Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Central repository for all project specifications, designs, and requirements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Document
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Filter by title / type / author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:bg-white transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue"
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16">ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Version</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Reviewer</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4">Uploaded</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-600">No documents found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or upload a new document.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{doc.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy flex items-center gap-1.5">
                        {doc.title}
                        {doc.link_url && doc.link_url !== '#' && (
                          <a href={doc.link_url} target="_blank" rel="noreferrer" className="text-dc-blue hover:text-blue-700">
                            <LinkIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-medium text-slate-600">
                      {doc.version}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border",
                        getStatusBadgeClass(doc.status)
                      )}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{doc.author}</td>
                    <td className="px-6 py-4 text-slate-500">{doc.reviewer || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map(t => (
                          <span key={t} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {doc.uploaded_at}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(doc)}
                        className="p-1.5 text-slate-400 hover:text-dc-blue hover:bg-blue-50 rounded transition-colors"
                        title="Edit Document"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                <FileText className="w-5 h-5 text-dc-blue" />
                {editingDoc ? "Edit Document Metadata" : "Add Document Record"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="doc-form" onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Document Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. System Architecture Specification"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Type <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      placeholder="e.g. Design, Requirement, Manual..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Version <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      placeholder="e.g. v1.0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="REVIEW">Under Review</option>
                      <option value="RELEASED">Released</option>
                      <option value="OBSOLETE">Obsolete</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Reviewer</label>
                    <input 
                      type="text" 
                      value={formReviewer}
                      onChange={(e) => setFormReviewer(e.target.value)}
                      placeholder="Name of reviewer..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. Architecture, Security, Draft..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Link URL</label>
                  <input 
                    type="url" 
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue focus:border-transparent transition-all"
                  />
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-navy hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="doc-form"
                className="btn-primary"
              >
                {editingDoc ? "Save Changes" : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
