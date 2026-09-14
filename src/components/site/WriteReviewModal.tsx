import { useState, useEffect, useRef } from "react";
import { Star, X, ChevronLeft, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { addReview } from "@/lib/reviews";

function StarRating({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-8 w-8";
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          className="p-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              (hover || value) >= star
                ? "fill-[#f5a623] text-[#f5a623]"
                : "fill-none text-muted-foreground/30",
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

const STEPS = ["Rating", "Review", "Details", "Submit"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i <= current ? "w-5 bg-foreground" : "w-1.5 bg-border",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function WriteReviewModal({
  open,
  onClose,
  productId,
  shopifyId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  shopifyId?: string;
  onSubmit: () => void;
}) {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setStep(0);
      setRating(0);
      setTitle("");
      setBody("");
      setName("");
      setEmail("");
      setImageUrl("");
      setError("");
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [open]);

  useEffect(() => {
    if (step === 1 && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [step]);

  if (!open) return null;

  const validateStep = (): boolean => {
    setError("");
    if (step === 0) {
      if (rating === 0) {
        setError("Please select a rating.");
        return false;
      }
    } else if (step === 1) {
      if (!body.trim()) {
        setError("Please write your review.");
        return false;
      }
    } else if (step === 3) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return false;
      }
      if (!email.trim()) {
        setError("Please enter your email address.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError("");

    const result = await addReview({
      productId,
      ...(shopifyId ? { shopifyId } : {}),
      rating,
      title: title.trim(),
      body: body.trim(),
      customerName: name.trim(),
      customerEmail: email.trim(),
      ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      onSubmit();
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }
  };

  const inputClass = cn(
    "w-full border border-border bg-white px-3 py-2.5 text-[0.82rem] text-foreground placeholder:text-muted-foreground/50",
    "focus:outline-none focus:ring-1 focus:ring-foreground transition-colors",
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-md bg-white shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-3.5">
          <div className="flex items-center gap-3">
            {step > 0 && !submitted && (
              <button
                type="button"
                onClick={handleBack}
                className="grid h-7 w-7 place-items-center hover:bg-muted transition-colors -ml-1"
                aria-label="Go back"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
            <h2 className="font-serif text-[1rem] text-foreground">Write a Review</h2>
          </div>
          <div className="flex items-center gap-3">
            {!submitted && <StepIndicator current={step} />}
            <button
              type="button"
              onClick={onClose}
              className="grid h-7 w-7 place-items-center hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div className="grid h-12 w-12 mx-auto place-items-center bg-accent/10 mb-4">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-[0.65rem] uppercase tracking-[0.15em] font-semibold text-accent mb-2">
              Thank You
            </p>
            <p className="text-[0.85rem] text-muted-foreground leading-relaxed">
              Your review has been submitted and will appear after verification.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-foreground text-white text-[0.72rem] font-semibold uppercase tracking-wide hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-6">
            {/* Step 0: Rating */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold text-muted-foreground mb-1">
                    Step 1 of 4
                  </p>
                  <p className="font-serif text-[1.1rem] text-foreground">
                    How would you rate this product?
                  </p>
                </div>
                <div className="flex justify-center">
                  <StarRating value={rating} onChange={setRating} />
                </div>
                {rating > 0 && (
                  <p className="text-[0.78rem] text-muted-foreground">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
                {error && <p className="text-[0.72rem] text-sale">{error}</p>}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={rating === 0}
                  className={cn(
                    "w-full py-3 text-[0.72rem] font-semibold uppercase tracking-wide transition-all duration-200",
                    rating === 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-white hover:bg-accent",
                  )}
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 1: Review */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold text-muted-foreground mb-1">
                    Step 2 of 4
                  </p>
                  <p className="font-serif text-[1.1rem] text-foreground">
                    What did you think about this product?
                  </p>
                </div>
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (error) setError("");
                  }}
                  rows={5}
                  placeholder="Share your experience with this product — fit, fabric, quality, comfort..."
                  className={cn(inputClass, "resize-none")}
                />
                {error && <p className="text-[0.72rem] text-sale">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-border py-3 text-[0.72rem] font-medium uppercase tracking-wide text-foreground hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!body.trim()}
                    className={cn(
                      "flex-1 py-3 text-[0.72rem] font-semibold uppercase tracking-wide transition-all duration-200",
                      !body.trim()
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-foreground text-white hover:bg-accent",
                    )}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Optional details */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold text-muted-foreground mb-1">
                    Step 3 of 4
                  </p>
                  <p className="font-serif text-[1.1rem] text-foreground">
                    Add more details
                  </p>
                  <p className="text-[0.78rem] text-muted-foreground mt-1">
                    All fields on this step are optional.
                  </p>
                </div>
                <div>
                  <label className="block text-[0.68rem] font-semibold uppercase tracking-wide text-foreground mb-1.5">
                    Review Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarise your review in a few words"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-semibold uppercase tracking-wide text-foreground mb-1.5">
                    Photo URL <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className={cn(inputClass, "flex-1")}
                    />
                    <div className="grid h-[42px] w-[42px] shrink-0 place-items-center border border-border">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  </div>
                  {imageUrl && (
                    <div className="mt-2 relative h-20 w-20 overflow-hidden border border-border">
                      <img
                        src={imageUrl}
                        alt="Review photo preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-border py-3 text-[0.72rem] font-medium uppercase tracking-wide text-foreground hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex-1 bg-foreground py-3 text-[0.72rem] font-semibold uppercase tracking-wide text-white hover:bg-accent transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Name + Email */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold text-muted-foreground mb-1">
                    Step 4 of 4
                  </p>
                  <p className="font-serif text-[1.1rem] text-foreground">
                    Almost done
                  </p>
                  <p className="text-[0.78rem] text-muted-foreground mt-1">
                    Your email will never be publicly displayed.
                  </p>
                </div>
                <div>
                  <label className="block text-[0.68rem] font-semibold uppercase tracking-wide text-foreground mb-1.5">
                    Your Name <span className="text-sale">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-semibold uppercase tracking-wide text-foreground mb-1.5">
                    Email Address <span className="text-sale">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="your@email.com"
                    className={inputClass}
                  />
                </div>
                {error && <p className="text-[0.72rem] text-sale">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-border py-3 text-[0.72rem] font-medium uppercase tracking-wide text-foreground hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !name.trim() || !email.trim()}
                    className={cn(
                      "flex-1 py-3 text-[0.72rem] font-semibold uppercase tracking-wide transition-all duration-200",
                      submitting || !name.trim() || !email.trim()
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-foreground text-white hover:bg-accent",
                    )}
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { StarRating };
