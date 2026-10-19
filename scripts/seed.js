require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const knex = require('knex')({ client: 'pg', connection: process.env.DATABASE_URL })
const bcrypt = require('bcryptjs')
const hash = pw => bcrypt.hashSync(pw, 10)

async function main() {
  const [{ count }] = await knex('users').count('id as count')
  if (parseInt(count) > 0) {
    console.log('⚠️  DB not empty — skipping. Run db:reset first.')
    return
  }
  console.log('⏳ Seeding...')

  await knex('users').insert({ name:'HR Admin', email:'hr@mrdiy.com', password:hash('hr123'), staff_id:'HR-001', department:'Human Resources', role:'HR' })

  const depts = [
    { dept:'Operations',      name:'Rashid Hamdan',     email:'hod@mrdiy.com',               staff_id:'H-00101' },
    { dept:'Retail',          name:'Fauziah Ismail',    email:'fauziah.ismail@mrdiy.com',    staff_id:'H-00102' },
    { dept:'Logistics',       name:'Zulkifli Nordin',   email:'zulkifli.nordin@mrdiy.com',   staff_id:'H-00103' },
    { dept:'Finance',         name:'Lim Bee Ching',     email:'lim.beeching@mrdiy.com',      staff_id:'H-00104' },
    { dept:'Human Resources', name:'Priya Subramaniam', email:'priya.subramaniam@mrdiy.com', staff_id:'H-00105' },
  ]
  const hodMap = {}
  for (const d of depts) {
    const [hod] = await knex('users').insert({ name:d.name, email:d.email, password:hash('hod123'), staff_id:d.staff_id, department:d.dept, role:'HOD' }).returning('*')
    hodMap[d.dept] = hod.id
  }

  const employees = [
    { name:'Ahmad Razif Bin Bakar',  email:'employee@mrdiy.com',           staff_id:'E-04291', dept:'Operations'      },
    { name:'Mohd Hafiz Bin Yusof',   email:'mohd.hafiz@mrdiy.com',     staff_id:'E-04292', dept:'Operations'      },
    { name:'Nurul Huda Bt Ramlan',   email:'nurul.huda@mrdiy.com',     staff_id:'E-04293', dept:'Operations'      },
    { name:'Azri Bin Othman',        email:'azri.othman@mrdiy.com',    staff_id:'E-04294', dept:'Operations'      },
    { name:'Saleha Bt Zainal',       email:'saleha.zainal@mrdiy.com',  staff_id:'E-04295', dept:'Operations'      },
    { name:'Firdaus Bin Kassim',     email:'firdaus.kassim@mrdiy.com', staff_id:'E-04296', dept:'Operations'      },
    { name:'Nurul Ain Bt Hamid',     email:'nurul.ain@mrdiy.com',      staff_id:'E-04287', dept:'Retail'          },
    { name:'Kavitha Rajasekaran',    email:'kavitha.raja@mrdiy.com',   staff_id:'E-04288', dept:'Retail'          },
    { name:'Tan Wei Liang',          email:'tan.weiliang@mrdiy.com',   staff_id:'E-04289', dept:'Retail'          },
    { name:'Norashikin Bt Musa',     email:'norashikin.musa@mrdiy.com',staff_id:'E-04290', dept:'Retail'          },
    { name:'Rajendran Pillai',       email:'rajendran.p@mrdiy.com',    staff_id:'E-04281', dept:'Retail'          },
    { name:'Wong Mei Ling',          email:'wong.meiling@mrdiy.com',   staff_id:'E-04282', dept:'Retail'          },
    { name:'Siti Rahimah Bt Alias',  email:'siti.rahimah@mrdiy.com',   staff_id:'E-04318', dept:'Logistics'       },
    { name:'Hairul Azwan Bin Daud',  email:'hairul.azwan@mrdiy.com',   staff_id:'E-04319', dept:'Logistics'       },
    { name:'Rosnah Bt Ibrahim',      email:'rosnah.ibrahim@mrdiy.com', staff_id:'E-04320', dept:'Logistics'       },
    { name:'Syafiq Bin Zamri',       email:'syafiq.zamri@mrdiy.com',   staff_id:'E-04321', dept:'Logistics'       },
    { name:'Chong Kok Wai',          email:'chong.kokwai@mrdiy.com',   staff_id:'E-04322', dept:'Logistics'       },
    { name:'Munirah Bt Saari',       email:'munirah.saari@mrdiy.com',  staff_id:'E-04323', dept:'Logistics'       },
    { name:'Noraini Bt Mansor',      email:'noraini.mansor@mrdiy.com', staff_id:'E-04340', dept:'Finance'         },
    { name:'Arif Bin Zainudin',      email:'arif.zainudin@mrdiy.com',  staff_id:'E-04341', dept:'Finance'         },
    { name:'Stella Ong Hui Yin',     email:'stella.ong@mrdiy.com',     staff_id:'E-04342', dept:'Finance'         },
    { name:'Mohd Amirul Bin Salleh', email:'mohd.amirul@mrdiy.com',    staff_id:'E-04343', dept:'Finance'         },
    { name:'Dayang Norfazlina',      email:'dayang.norfaz@mrdiy.com',  staff_id:'E-04344', dept:'Finance'         },
    { name:'Suresh Kumar A/L Raman', email:'suresh.kumar@mrdiy.com',   staff_id:'E-04345', dept:'Finance'         },
    { name:'Zarina Bt Ghazali',      email:'zarina.ghazali@mrdiy.com', staff_id:'E-04360', dept:'Human Resources' },
    { name:'Hafizuddin Bin Razali',  email:'hafizuddin.r@mrdiy.com',   staff_id:'E-04361', dept:'Human Resources' },
    { name:'Umi Kalthum Bt Bahari',  email:'umi.kalthum@mrdiy.com',    staff_id:'E-04362', dept:'Human Resources' },
    { name:'Ng Boon Keong',          email:'ng.boonkeong@mrdiy.com',   staff_id:'E-04363', dept:'Human Resources' },
    { name:'Asmah Bt Razak',         email:'asmah.razak@mrdiy.com',    staff_id:'E-04364', dept:'Human Resources' },
    { name:'Venkatesh A/L Pillai',   email:'venkatesh.p@mrdiy.com',    staff_id:'E-04365', dept:'Human Resources' },
  ]
  for (const e of employees) {
    await knex('users').insert({ name:e.name, email:e.email, password:hash('emp123'), staff_id:e.staff_id, department:e.dept, role:'EMPLOYEE', hod_id:hodMap[e.dept] })
  }

  console.log('✅ Seeded: 1 HR + 5 HODs + 30 employees')
  console.log('')
  console.log('   employee@mrdiy.com  /  emp123')
  console.log('   hod@mrdiy.com   /  hod123')
  console.log('   hr@mrdiy.com    /  hr123')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => knex.destroy())
