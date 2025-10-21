import { useState } from "react";
import { FaTimes } from "react-icons/fa";

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageSelect: (language: "english" | "telugu") => void;
}

const LanguageSelectionModal = ({
  isOpen,
  onClose,
  onLanguageSelect,
}: LanguageSelectionModalProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<
    "english" | "telugu" | null
  >(null);

  const handleConfirm = () => {
    if (selectedLanguage) {
      onLanguageSelect(selectedLanguage);
      setSelectedLanguage(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedLanguage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
            Select Language
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FaTimes className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            Choose the language for your new conversation:
          </p>

          <div className="space-y-2 sm:space-y-3">
            {/* English Option */}
            <label className="flex items-center p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="language"
                value="english"
                checked={selectedLanguage === "english"}
                onChange={(e) =>
                  setSelectedLanguage(e.target.value as "english" | "telugu")
                }
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                aria-label="Select English language"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  English
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  King James Version (KJV)
                </div>
              </div>
            </label>

            {/* Telugu Option */}
            <label className="flex items-center p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="language"
                value="telugu"
                checked={selectedLanguage === "telugu"}
                onChange={(e) =>
                  setSelectedLanguage(e.target.value as "english" | "telugu")
                }
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                aria-label="Select Telugu language"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  తెలుగు (Telugu)
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Telugu Bible
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLanguage}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Create Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionModal;
