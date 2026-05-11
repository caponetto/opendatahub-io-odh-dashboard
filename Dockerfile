# Build arguments
ARG SOURCE_CODE=.
ARG BUILD_MODE=ODH
ARG ASSEMBLER=dashboard-dist-full

# Use ubi9/nodejs-22 as default base image
ARG BASE_IMAGE="registry.access.redhat.com/ubi9/nodejs-22:latest"

FROM ${BASE_IMAGE} as builder

## Build args to be used at this step
ARG SOURCE_CODE
ARG BUILD_MODE
ARG ASSEMBLER

WORKDIR /usr/src/app

## Copying in source code
COPY --chown=default:root ${SOURCE_CODE} /usr/src/app

# Change file ownership to the assemble user
USER default

RUN npm cache clean --force

RUN npm ci --ignore-scripts

ENV TURBO_TELEMETRY_DISABLED=1
RUN if [ "$BUILD_MODE" = "RHOAI" ]; then \
      echo "Setting up RHOAI vars.."; \
      echo '#!/bin/sh' > /tmp/env.sh; \
      echo 'export ODH_LOGO=../images/rhoai-logo.svg' >> /tmp/env.sh; \
      echo 'export ODH_LOGO_DARK=../images/rhoai-logo-dark-theme.svg' >> /tmp/env.sh; \
      echo 'export ODH_PRODUCT_NAME="Red Hat OpenShift AI"' >> /tmp/env.sh; \
      echo 'export ODH_FAVICON="rhoai-favicon.svg"' >> /tmp/env.sh; \
      echo 'export DOC_LINK="https://docs.redhat.com/en/documentation/red_hat_openshift_ai/"' >> /tmp/env.sh; \
      echo 'export SUPPORT_LINK="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"' >> /tmp/env.sh; \
      echo 'export COMMUNITY_LINK=""' >> /tmp/env.sh; \
    else \
      echo "Sticking to ODH vars.."; \
      echo '#!/bin/sh' > /tmp/env.sh; \
    fi
RUN . /tmp/env.sh && npm run build

# npm prune --omit=dev does not correctly handle npm workspaces -- it only
# removes root-level devDependencies while leaving all workspace devDependencies
# hoisted in node_modules/. See scripts/prepare-production-manifest.js for details.
ENV ASSEMBLER_DIR=/usr/src/app/packages/${ASSEMBLER}
RUN node scripts/prepare-production-manifest.js \
    && npm install --omit=dev --omit=optional --ignore-scripts

# Stage compiled extension backend files for selective COPY into runtime image.
# This runs after npm install --omit=dev. The script only uses Node.js builtins
# and reads .plugin-manifest.json (a file on disk, not a node_module), so it
# survives the dev-dependency prune.
RUN node scripts/stage-production-backend.js

# This rm -rf is a safety net. It is currently not needed, but it is a good idea to keep it in case future changes accidentally introduce esbuild binaries.
# Remove esbuild binaries to ensure FIPS compliance
# esbuild is a build-time dependency transitively included through @perses-dev/plugin-system
# -> @module-federation/enhanced -> @module-federation/cli -> @modern-js/node-bundle-require
# These Go binaries are NOT needed at runtime and are NOT FIPS compliant
RUN rm -rf node_modules/esbuild node_modules/@esbuild node_modules/.bin/esbuild

FROM ${BASE_IMAGE} as runtime

ARG ASSEMBLER
ENV ASSEMBLER_DIR=/usr/src/app/packages/${ASSEMBLER}

WORKDIR /usr/src/app

RUN mkdir /usr/src/app/logs && chmod 775 /usr/src/app/logs

USER 1001:0

# Frontend static assets — path depends on the assembler (full or slim)
COPY --chown=default:root --from=builder /usr/src/app/packages/${ASSEMBLER}/public /usr/src/app/packages/${ASSEMBLER}/public

# Core backend: dashboard-shell-backend (compiled)
COPY --chown=default:root --from=builder /usr/src/app/packages/dashboard-shell-backend/package.json /usr/src/app/packages/dashboard-shell-backend/package.json
COPY --chown=default:root --from=builder /usr/src/app/packages/dashboard-shell-backend/dist /usr/src/app/packages/dashboard-shell-backend/dist

# Staged backend files: dashboard-config, foundation-backend, dashboard-build, and extension route backends.
# See scripts/stage-production-backend.js — only selected extensions are included.
COPY --chown=default:root --from=builder /usr/src/app/.production-backend/packages /usr/src/app/packages

# Root manifest, dependencies, and config
COPY --chown=default:root --from=builder /usr/src/app/package.json /usr/src/app/package.json
COPY --chown=default:root --from=builder /usr/src/app/package-lock.json /usr/src/app/package-lock.json
COPY --chown=default:root --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=default:root --from=builder /usr/src/app/.npmrc /usr/src/app/.npmrc
COPY --chown=default:root --from=builder /usr/src/app/.env /usr/src/app/.env
COPY --chown=default:root --from=builder /usr/src/app/data /usr/src/app/data

WORKDIR /usr/src/app/packages/dashboard-shell-backend

CMD ["npm", "run", "start"]

LABEL io.opendatahub.component="odh-dashboard" \
      io.k8s.display-name="odh-dashboard" \
      name="open-data-hub/odh-dashboard-ubi9" \
      summary="odh-dashboard" \
      description="Open Data Hub Dashboard"
