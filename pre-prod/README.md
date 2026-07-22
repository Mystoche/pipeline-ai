# CI/CD DevSecOps pour une Application de Paiement (Pawpay)

## Objectif

Ce projet implémente une pipeline DevSecOps complète pour une application de paiement permettant de :

* Provisionner l’infrastructure avec Terraform
* Déployer Jenkins, SonarQube et Trivy via Docker
* Intégrer les outils de qualité et de sécurité
* Déployer en pré-production (Docker)
* Déployer en production (Kubernetes)

---

# 1. Installation de Terraform sur Debian

## Référence

https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli

## Installation

```bash
sudo apt update && sudo apt install -y gnupg software-properties-common

wget -O- https://apt.releases.hashicorp.com/gpg | \
gpg --dearmor | \
sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update && sudo apt install terraform
```

## Vérification

```bash
terraform -v
```

---

# 2. Provisioning avec Terraform (Docker)

## Référence

https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs

## Objectif

Déployer automatiquement les outils DevSecOps sous forme de conteneurs Docker :

* Jenkins
* SonarQube
* Trivy

## Configuration Terraform

```hcl
provider "docker" {}

resource "docker_image" "jenkins" {
  name = "jenkins/jenkins:lts"
}

resource "docker_container" "jenkins" {
  name  = "jenkins"
  image = docker_image.jenkins.image_id

  ports {
    internal = 8080
    external = 8080
  }
}

resource "docker_image" "sonarqube" {
  name = "sonarqube"
}

resource "docker_container" "sonarqube" {
  name  = "sonarqube"
  image = docker_image.sonarqube.image_id

  ports {
    internal = 9000
    external = 9000
  }
}

resource "docker_image" "trivy" {
  name = "aquasec/trivy"
}

resource "docker_container" "trivy" {
  name    = "trivy"
  image   = docker_image.trivy.image_id
  command = ["sleep", "infinity"]
}
```

## Déploiement

```bash
terraform init
terraform plan
terraform apply 
```

## Résultat

Les outils Jenkins, SonarQube et Trivy sont entièrement provisionnés via Terraform en utilisant Docker comme runtime.

---

# 3. Configuration de Jenkins

## Référence

https://www.jenkins.io/doc/

## Accès

http://<IP>:8080

## Étapes

### Installation des plugins

* Git
* Pipeline
* Docker
* SonarQube Scanner

### Configuration des credentials

* GitHub (token ou SSH)
* Docker registry
* Kubernetes (token)

---

## Configuration Gmail (notifications)

## Référence

https://www.jenkins.io/doc/book/system-administration/administering-system/#mail

### Paramètres

* SMTP Server : smtp.gmail.com
* Port : 587
* TLS activé
* Authentification via App Password

### Étapes

1. Manage Jenkins
2. Configure System
3. E-mail Notification
4. Ajouter email et App Password

---

# 4. Configuration de SonarQube

## Référence

https://docs.sonarqube.org/latest/

## Accès

http://<IP>:9000

## Étapes

### Création du projet

* Nom du projet
* Project Key

### Génération du token

* My Account
* Security
* Generate Token

### Configuration du webhook (Jenkins)

http://jenkins:8080/sonarqube-webhook/

### Intégration dans Jenkins

* Ajouter serveur SonarQube
* Ajouter token
* Associer projet
* Dans Tools creer un tools sonarqube


---

# 5. Intégration de Trivy

## Référence

https://aquasecurity.github.io/trivy/latest/

## Objectif

Scanner les vulnérabilités :

* du code source
* des images Docker

## Commandes

```bash
trivy fs .
trivy image my-app:latest
```

## Intégration

Trivy est déployé via Terraform dans un conteneur Docker et utilisé dans le processus CI pour effectuer des scans de sécurité avant le déploiement.

---

# 6. Intégration de Kubernetes

## Référence

https://kubernetes.io/docs/home/

## Objectif

Permettre à Jenkins de déployer sur Kubernetes de manière sécurisée via RBAC.

---

## 6.1 Création du namespace Jenkins

```bash
kubectl create namespace jenkins
```

---

## 6.2 Création du ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jenkins-sa
  namespace: jenkins
```

```bash
kubectl apply -f serviceaccount.yaml
```

---

## 6.3 Création du rôle

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: jenkins-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "deployments"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]
```

---

## 6.4 Binding du rôle

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: jenkins-binding
subjects:
- kind: ServiceAccount
  name: jenkins-sa
  namespace: jenkins
roleRef:
  kind: ClusterRole
  name: jenkins-role
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f role-binding.yaml
```

---

## 6.5 Récupération du token

```bash
kubectl create token jenkins-sa -n jenkins
```

Copier ce token pour Jenkins.

---

## 6.6 Configuration dans Jenkins

### Ajouter le token

* Manage Jenkins
* Manage Credentials
* Ajouter "Secret Text"
* Coller le token

---

## 6.7 Création du Kubernetes Cloud

* Manage Jenkins
* Manage Nodes and Clouds
* Configure Clouds
* Ajouter Kubernetes

### Paramètres :

* Kubernetes URL : https://<K8S_API_SERVER>
* Namespace : jenkins
* Credentials : token
* Jenkins URL : http://jenkins:8080

---

## 6.8 Commandes Kubernetes

### Déploiement

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### Vérification

```bash
kubectl get pods
kubectl get services
```

---

# 7. Déploiement des environnements

## Pré-production (Docker)

```bash
docker build -t my-app .
docker run -d -p 3000:3000 my-app
```

## Production (Kubernetes)

```bash
kubectl apply -f k8s/
```

---

# 8. Sécurité et qualité

* Analyse de code avec SonarQube
* Scan de vulnérabilités avec Trivy
* Contrôle avant déploiement
* Séparation des environnements

---

# Conclusion

Ce projet met en œuvre une approche DevSecOps complète basée sur :

* Infrastructure as Code avec Terraform
* Déploiement automatisé avec Docker
* Intégration de la sécurité avec Trivy
* Analyse de qualité avec SonarQube
* Orchestration avec Kubernetes

---
